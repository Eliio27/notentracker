// Haupt-Datenschicht: Supabase (online) + IndexedDB (offline-Cache & Queue)
import { supabase } from './supabase'
import * as cache from './db'

const CODE_KEY = 'nt_user_code'

export const getCode = () => localStorage.getItem(CODE_KEY)
export const isLoggedIn = () => !!getCode()

// ─── Helpers ────────────────────────────────────────────────────────────────

function transformSemester(s) {
  return { id: s.id, name: s.name, active: s.active }
}

function transformSubject(s) {
  return { id: s.id, semesterId: s.semester_id, name: s.name }
}

function transformTest(t) {
  return {
    id: t.id,
    subjectId: t.subject_id,
    title: t.title,
    grade: parseFloat(t.grade),
    points: t.points ?? null,
    maxPoints: t.max_points ?? null,
    date: t.date,
    notes: t.notes ?? '',
    photo: t.photo_url ?? null,  // URL statt base64
  }
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function base64ToBlob(base64) {
  const [header, data] = base64.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const bytes = atob(data)
  const buf = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)
  return new Blob([buf], { type: mime })
}

async function uploadPhoto(fileOrBlob, filename) {
  const name = filename || `${Date.now()}.jpg`
  const path = `${getCode()}/${name}`
  const { error } = await supabase.storage.from('photos').upload(path, fileOrBlob, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(code) {
  const trimmed = code.trim().toLowerCase()
  if (!trimmed) throw new Error('Code darf nicht leer sein.')
  const { error } = await supabase.from('users').upsert({ code: trimmed }, { onConflict: 'code' })
  if (error) throw error
  localStorage.setItem(CODE_KEY, trimmed)
}

export function logout() {
  localStorage.removeItem(CODE_KEY)
}

// ─── Semesters ───────────────────────────────────────────────────────────────

export async function getSemesters() {
  if (!navigator.onLine) return cache.getCachedSemesters()
  const { data, error } = await supabase
    .from('semesters').select('*').eq('user_code', getCode()).order('id')
  if (error) return cache.getCachedSemesters()
  const transformed = data.map(transformSemester)
  await cache.cacheSemesters(transformed)
  return transformed
}

export async function addSemester(sem) {
  if (!navigator.onLine) {
    const localId = -Date.now()
    const localSem = { id: localId, name: sem.name, active: true }
    // Alle anderen deaktivieren im Cache
    const cached = await cache.getCachedSemesters()
    for (const s of cached) await cache.putCachedSemester({ ...s, active: false })
    await cache.putCachedSemester(localSem)
    await cache.addToQueue({ type: 'addSemester', data: { name: sem.name, localId } })
    return localSem
  }
  // Alle anderen deaktivieren
  await supabase.from('semesters').update({ active: false }).eq('user_code', getCode())
  const { data, error } = await supabase
    .from('semesters').insert({ user_code: getCode(), name: sem.name, active: true })
    .select().single()
  if (error) throw error
  const transformed = transformSemester(data)
  await cache.putCachedSemester(transformed)
  return transformed
}

export async function setActiveSemester(id) {
  if (!navigator.onLine) {
    const cached = await cache.getCachedSemesters()
    for (const s of cached) await cache.putCachedSemester({ ...s, active: s.id === id })
    await cache.addToQueue({ type: 'setActiveSemester', data: { id } })
    return
  }
  await supabase.from('semesters').update({ active: false }).eq('user_code', getCode())
  await supabase.from('semesters').update({ active: true }).eq('id', id).eq('user_code', getCode())
  // Cache updaten
  const cached = await cache.getCachedSemesters()
  for (const s of cached) await cache.putCachedSemester({ ...s, active: s.id === id })
}

export async function deleteSemester(id) {
  if (!navigator.onLine) {
    await cache.removeCachedSemester(id)
    await cache.addToQueue({ type: 'deleteSemester', data: { id } })
    return
  }
  const { error } = await supabase.from('semesters').delete().eq('id', id).eq('user_code', getCode())
  if (error) throw error
  await cache.removeCachedSemester(id)
}

// ─── Subjects ────────────────────────────────────────────────────────────────

export async function getSubjects() {
  if (!navigator.onLine) return cache.getCachedSubjects()
  const { data, error } = await supabase
    .from('subjects').select('*').eq('user_code', getCode()).order('id')
  if (error) return cache.getCachedSubjects()
  const transformed = data.map(transformSubject)
  await cache.cacheSubjects(transformed)
  return transformed
}

export async function addSubject(sub) {
  if (!navigator.onLine) {
    const localId = -Date.now()
    const localSub = { id: localId, semesterId: sub.semesterId, name: sub.name }
    await cache.putCachedSubject(localSub)
    await cache.addToQueue({ type: 'addSubject', data: { ...sub, localId } })
    return localSub
  }
  const { data, error } = await supabase
    .from('subjects').insert({ user_code: getCode(), semester_id: sub.semesterId, name: sub.name })
    .select().single()
  if (error) throw error
  const transformed = transformSubject(data)
  await cache.putCachedSubject(transformed)
  return transformed
}

export async function deleteSubject(id) {
  if (id < 0) {
    await cache.removeCachedSubject(id)
    const q = await cache.getQueue()
    for (const e of q) {
      if (e.type === 'addSubject' && e.data.localId === id) await cache.removeFromQueue(e.id)
    }
    return
  }
  if (!navigator.onLine) {
    await cache.removeCachedSubject(id)
    await cache.addToQueue({ type: 'deleteSubject', data: { id } })
    return
  }
  const { error } = await supabase.from('subjects').delete().eq('id', id).eq('user_code', getCode())
  if (error) throw error
  await cache.removeCachedSubject(id)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

export async function getTests() {
  if (!navigator.onLine) return cache.getCachedTests()
  const { data, error } = await supabase
    .from('tests').select('*').eq('user_code', getCode()).order('date', { ascending: false })
  if (error) return cache.getCachedTests()
  const transformed = data.map(transformTest)
  await cache.cacheTests(transformed)
  return transformed
}

export async function getTest(id) {
  if (!navigator.onLine) return cache.getCachedTest(id)
  const { data, error } = await supabase
    .from('tests').select('*').eq('id', id).eq('user_code', getCode()).single()
  if (error) return cache.getCachedTest(id)
  return transformTest(data)
}

export async function getTestsBySubject(subjectId) {
  const tests = await getTests()
  return tests.filter((t) => t.subjectId === Number(subjectId))
}

export async function addTest(testData, photoFile) {
  const code = getCode()

  if (!navigator.onLine) {
    let photoBase64 = null
    if (photoFile) photoBase64 = await fileToBase64(photoFile)
    const localId = -Date.now()
    const localTest = { id: localId, subjectId: testData.subjectId, ...testData, photo: photoBase64 }
    await cache.putCachedTest(localTest)
    await cache.addToQueue({ type: 'addTest', data: { ...testData, photoBase64, localId } })
    return localId
  }

  let photoUrl = null
  if (photoFile) photoUrl = await uploadPhoto(photoFile, `${Date.now()}.jpg`)

  const { data, error } = await supabase.from('tests').insert({
    user_code: code,
    subject_id: testData.subjectId,
    title: testData.title,
    grade: testData.grade,
    points: testData.points || null,
    max_points: testData.maxPoints || null,
    date: testData.date,
    notes: testData.notes || null,
    photo_url: photoUrl,
  }).select().single()

  if (error) throw error
  const transformed = transformTest(data)
  await cache.putCachedTest(transformed)
  return transformed.id
}

export async function deleteTest(id) {
  if (id < 0) {
    await cache.removeCachedTest(id)
    const q = await cache.getQueue()
    for (const e of q) {
      if (e.type === 'addTest' && e.data.localId === id) await cache.removeFromQueue(e.id)
    }
    return
  }
  if (!navigator.onLine) {
    await cache.removeCachedTest(id)
    await cache.addToQueue({ type: 'deleteTest', data: { id } })
    return
  }
  const { error } = await supabase.from('tests').delete().eq('id', id).eq('user_code', getCode())
  if (error) throw error
  await cache.removeCachedTest(id)
}

// ─── Sync Queue (bei Reconnect) ───────────────────────────────────────────────

export async function syncQueue() {
  if (!navigator.onLine) return 0
  const code = getCode()
  const queue = await cache.getQueue()
  let synced = 0

  for (const entry of queue) {
    try {
      switch (entry.type) {
        case 'addTest': {
          let photoUrl = null
          if (entry.data.photoBase64) {
            const blob = base64ToBlob(entry.data.photoBase64)
            photoUrl = await uploadPhoto(blob, `sync_${Date.now()}.jpg`)
          }
          const { data } = await supabase.from('tests').insert({
            user_code: code,
            subject_id: entry.data.subjectId,
            title: entry.data.title,
            grade: entry.data.grade,
            points: entry.data.points || null,
            max_points: entry.data.maxPoints || null,
            date: entry.data.date,
            notes: entry.data.notes || null,
            photo_url: photoUrl,
          }).select().single()
          if (data) {
            await cache.removeCachedTest(entry.data.localId)
            await cache.putCachedTest(transformTest(data))
          }
          break
        }
        case 'deleteTest':
          await supabase.from('tests').delete().eq('id', entry.data.id).eq('user_code', code)
          break
        case 'addSubject': {
          const { data } = await supabase.from('subjects').insert({
            user_code: code, semester_id: entry.data.semesterId, name: entry.data.name,
          }).select().single()
          if (data) {
            await cache.removeCachedSubject(entry.data.localId)
            await cache.putCachedSubject(transformSubject(data))
          }
          break
        }
        case 'deleteSubject':
          await supabase.from('subjects').delete().eq('id', entry.data.id).eq('user_code', code)
          break
        case 'addSemester': {
          await supabase.from('semesters').update({ active: false }).eq('user_code', code)
          const { data } = await supabase.from('semesters').insert({
            user_code: code, name: entry.data.name, active: true,
          }).select().single()
          if (data) {
            await cache.removeCachedSemester(entry.data.localId)
            await cache.putCachedSemester(transformSemester(data))
          }
          break
        }
        case 'deleteSemester':
          await supabase.from('semesters').delete().eq('id', entry.data.id).eq('user_code', code)
          break
        case 'setActiveSemester':
          await supabase.from('semesters').update({ active: false }).eq('user_code', code)
          await supabase.from('semesters').update({ active: true }).eq('id', entry.data.id).eq('user_code', code)
          break
      }
      await cache.removeFromQueue(entry.id)
      synced++
    } catch (e) {
      console.error('Sync failed:', entry.type, e)
    }
  }
  return synced
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export async function exportAll() {
  const semesters = await getSemesters()
  const subjects = await getSubjects()
  const tests = await getTests()
  return { semesters, subjects, tests, exportedAt: new Date().toISOString() }
}

export async function importAll(data) {
  const code = getCode()
  // Alles löschen
  await supabase.from('tests').delete().eq('user_code', code)
  await supabase.from('subjects').delete().eq('user_code', code)
  await supabase.from('semesters').delete().eq('user_code', code)

  // Neue Daten einfügen (IDs werden von Supabase neu vergeben)
  for (const s of (data.semesters || [])) {
    await supabase.from('semesters').insert({ user_code: code, name: s.name, active: s.active })
  }
  // Fächer und Tests brauchen neue IDs – nach Semester-Insert neu laden
  const { data: newSems } = await supabase.from('semesters').select('*').eq('user_code', code).order('id')

  for (let i = 0; i < (data.subjects || []).length; i++) {
    const sub = data.subjects[i]
    // Semester-Index beibehalten
    const semIdx = (data.semesters || []).findIndex((s) => s.id === sub.semesterId)
    const newSemId = newSems[semIdx]?.id
    if (!newSemId) continue
    await supabase.from('subjects').insert({ user_code: code, semester_id: newSemId, name: sub.name })
  }
  const { data: newSubs } = await supabase.from('subjects').select('*').eq('user_code', code).order('id')

  for (const t of (data.tests || [])) {
    const subIdx = (data.subjects || []).findIndex((s) => s.id === t.subjectId)
    const newSubId = newSubs[subIdx]?.id
    if (!newSubId) continue
    await supabase.from('tests').insert({
      user_code: code,
      subject_id: newSubId,
      title: t.title,
      grade: t.grade,
      points: t.points || null,
      max_points: t.maxPoints || null,
      date: t.date,
      notes: t.notes || null,
      photo_url: t.photo || null,
    })
  }
}
