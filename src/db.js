import { openDB } from 'idb';

const DB_NAME = 'notentracker';
const DB_VERSION = 2;

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('subjects', { keyPath: 'id', autoIncrement: true });
        const testStore = db.createObjectStore('tests', { keyPath: 'id', autoIncrement: true });
        testStore.createIndex('subjectId', 'subjectId');
      }
      if (oldVersion < 2) {
        db.createObjectStore('semesters', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

// --- Semesters ---

export async function getSemesters() {
  const db = await getDB();
  return db.getAll('semesters');
}

export async function addSemester(semester) {
  const db = await getDB();
  // Neues Semester wird aktiv — alle anderen deaktivieren
  const tx = db.transaction('semesters', 'readwrite');
  const all = await tx.store.getAll();
  for (const s of all) {
    if (s.active) {
      s.active = false;
      await tx.store.put(s);
    }
  }
  await tx.done;
  const db2 = await getDB();
  return db2.add('semesters', { ...semester, active: true });
}

export async function setActiveSemester(id) {
  const db = await getDB();
  const tx = db.transaction('semesters', 'readwrite');
  const all = await tx.store.getAll();
  for (const s of all) {
    const shouldBeActive = s.id === id;
    if (s.active !== shouldBeActive) {
      s.active = shouldBeActive;
      await tx.store.put(s);
    }
  }
  await tx.done;
}

export async function deleteSemester(id) {
  const db = await getDB();
  const allTests = await db.getAll('tests');
  const allSubjects = await db.getAll('subjects');
  const tx = db.transaction(['semesters', 'tests', 'subjects'], 'readwrite');
  // Lösche alle Tests deren Fach zu diesem Semester gehört
  const semSubjectIds = allSubjects.filter((s) => s.semesterId === id).map((s) => s.id);
  for (const t of allTests) {
    if (semSubjectIds.includes(t.subjectId)) {
      await tx.objectStore('tests').delete(t.id);
    }
  }
  // Lösche alle Fächer dieses Semesters
  for (const s of allSubjects) {
    if (s.semesterId === id) {
      await tx.objectStore('subjects').delete(s.id);
    }
  }
  await tx.objectStore('semesters').delete(id);
  await tx.done;
}

// --- Subjects ---

export async function getSubjects() {
  const db = await getDB();
  return db.getAll('subjects');
}

export async function getSubjectsBySemester(semesterId) {
  const db = await getDB();
  const all = await db.getAll('subjects');
  return all.filter((s) => s.semesterId === semesterId);
}

export async function addSubject(subject) {
  const db = await getDB();
  return db.add('subjects', subject);
}

export async function deleteSubject(id) {
  const db = await getDB();
  const tx = db.transaction(['subjects', 'tests'], 'readwrite');
  const testStore = tx.objectStore('tests');
  const index = testStore.index('subjectId');
  let cursor = await index.openCursor(id);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.objectStore('subjects').delete(id);
  await tx.done;
}

// --- Tests ---

export async function getTests() {
  const db = await getDB();
  return db.getAll('tests');
}

export async function getTestsBySubject(subjectId) {
  const db = await getDB();
  return db.getAllFromIndex('tests', 'subjectId', subjectId);
}

export async function getTestsBySemester(semesterId, allSubjects) {
  const db = await getDB();
  const semSubjectIds = allSubjects
    .filter((s) => s.semesterId === semesterId)
    .map((s) => s.id);
  const all = await db.getAll('tests');
  return all.filter((t) => semSubjectIds.includes(t.subjectId));
}

export async function addTest(test) {
  const db = await getDB();
  return db.add('tests', test);
}

export async function getTest(id) {
  const db = await getDB();
  return db.get('tests', id);
}

export async function deleteTest(id) {
  const db = await getDB();
  return db.delete('tests', id);
}

// --- Export / Import ---

export async function exportAll() {
  const db = await getDB();
  const subjects = await db.getAll('subjects');
  const tests = await db.getAll('tests');
  const semesters = await db.getAll('semesters');
  return { subjects, tests, semesters, exportedAt: new Date().toISOString() };
}

export async function importAll(data) {
  const db = await getDB();
  const stores = ['subjects', 'tests', 'semesters'];
  const tx = db.transaction(stores, 'readwrite');
  await tx.objectStore('subjects').clear();
  await tx.objectStore('tests').clear();
  await tx.objectStore('semesters').clear();
  for (const s of (data.subjects || [])) {
    await tx.objectStore('subjects').add(s);
  }
  for (const t of (data.tests || [])) {
    await tx.objectStore('tests').add(t);
  }
  for (const sem of (data.semesters || [])) {
    await tx.objectStore('semesters').add(sem);
  }
  await tx.done;
}
