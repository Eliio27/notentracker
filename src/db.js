import { openDB } from 'idb';

const DB_NAME = 'notentracker';
const DB_VERSION = 1;

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('tests')) {
        const store = db.createObjectStore('tests', { keyPath: 'id', autoIncrement: true });
        store.createIndex('subjectId', 'subjectId');
      }
    },
  });
}

export async function getSubjects() {
  const db = await getDB();
  return db.getAll('subjects');
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

export async function getTests() {
  const db = await getDB();
  return db.getAll('tests');
}

export async function getTestsBySubject(subjectId) {
  const db = await getDB();
  return db.getAllFromIndex('tests', 'subjectId', subjectId);
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

export async function exportAll() {
  const db = await getDB();
  const subjects = await db.getAll('subjects');
  const tests = await db.getAll('tests');
  return { subjects, tests, exportedAt: new Date().toISOString() };
}

export async function importAll(data) {
  const db = await getDB();
  const tx = db.transaction(['subjects', 'tests'], 'readwrite');
  await tx.objectStore('subjects').clear();
  await tx.objectStore('tests').clear();
  for (const s of data.subjects) {
    await tx.objectStore('subjects').add(s);
  }
  for (const t of data.tests) {
    await tx.objectStore('tests').add(t);
  }
  await tx.done;
}
