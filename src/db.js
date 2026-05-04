// IndexedDB – nur als Offline-Cache & Sync-Queue
import { openDB } from 'idb'

const DB_NAME = 'notentracker'
const DB_VERSION = 3

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('subjects', { keyPath: 'id' })
        const ts = db.createObjectStore('tests', { keyPath: 'id' })
        ts.createIndex('subjectId', 'subjectId')
        db.createObjectStore('semesters', { keyPath: 'id' })
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
      } else {
        if (oldVersion < 2) {
          db.createObjectStore('semesters', { keyPath: 'id' })
        }
        if (oldVersion < 3) {
          // Wipe alte IDB-Daten (Struktur inkompatibel mit Supabase-IDs)
          if (db.objectStoreNames.contains('subjects')) db.deleteObjectStore('subjects')
          if (db.objectStoreNames.contains('tests')) db.deleteObjectStore('tests')
          if (db.objectStoreNames.contains('semesters')) db.deleteObjectStore('semesters')
          db.createObjectStore('subjects', { keyPath: 'id' })
          const ts2 = db.createObjectStore('tests', { keyPath: 'id' })
          ts2.createIndex('subjectId', 'subjectId')
          db.createObjectStore('semesters', { keyPath: 'id' })
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
        }
      }
    },
  })
}

// --- Cache: Semesters ---
export async function cacheSemesters(data) {
  const db = await getDB()
  const tx = db.transaction('semesters', 'readwrite')
  await tx.store.clear()
  for (const s of data) await tx.store.put(s)
  await tx.done
}
export async function getCachedSemesters() {
  return (await getDB()).getAll('semesters')
}
export async function putCachedSemester(s) {
  return (await getDB()).put('semesters', s)
}
export async function removeCachedSemester(id) {
  return (await getDB()).delete('semesters', id)
}

// --- Cache: Subjects ---
export async function cacheSubjects(data) {
  const db = await getDB()
  const tx = db.transaction('subjects', 'readwrite')
  await tx.store.clear()
  for (const s of data) await tx.store.put(s)
  await tx.done
}
export async function getCachedSubjects() {
  return (await getDB()).getAll('subjects')
}
export async function putCachedSubject(s) {
  return (await getDB()).put('subjects', s)
}
export async function removeCachedSubject(id) {
  return (await getDB()).delete('subjects', id)
}

// --- Cache: Tests ---
export async function cacheTests(data) {
  const db = await getDB()
  const tx = db.transaction('tests', 'readwrite')
  await tx.store.clear()
  for (const t of data) await tx.store.put(t)
  await tx.done
}
export async function getCachedTests() {
  return (await getDB()).getAll('tests')
}
export async function getCachedTest(id) {
  return (await getDB()).get('tests', id)
}
export async function putCachedTest(t) {
  return (await getDB()).put('tests', t)
}
export async function removeCachedTest(id) {
  return (await getDB()).delete('tests', id)
}

// --- Sync Queue ---
export async function addToQueue(entry) {
  return (await getDB()).add('sync_queue', { ...entry, timestamp: Date.now() })
}
export async function getQueue() {
  return (await getDB()).getAll('sync_queue')
}
export async function removeFromQueue(id) {
  return (await getDB()).delete('sync_queue', id)
}
export async function clearQueue() {
  const db = await getDB()
  const tx = db.transaction('sync_queue', 'readwrite')
  await tx.store.clear()
  await tx.done
}
