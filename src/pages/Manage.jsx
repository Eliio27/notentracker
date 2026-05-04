import { useState, useRef } from 'react';
import {
  addSemester, deleteSemester, setActiveSemester,
  addSubject, deleteSubject,
  exportAll, importAll,
} from '../db';
import { getSubjectColor } from '../utils';

export default function Manage({ onChanged, semesters, subjects }) {
  const [subjectName, setSubjectName] = useState('');
  const [editSemId, setEditSemId] = useState(semesters.find((s) => s.active)?.id || semesters[0]?.id || null);
  const fileRef = useRef();

  const activeSemester = semesters.find((s) => s.active);
  const viewSem = semesters.find((s) => s.id === editSemId);
  const semSubjects = subjects.filter((s) => s.semesterId === editSemId);

  const nextNumber = semesters.length + 1;

  const handleNewSemester = async () => {
    const name = `${nextNumber}. Semester`;
    await addSemester({ name, active: true });
    onChanged();
  };

  const handleDeleteSemester = async (id, name) => {
    if (!confirm(`"${name}" und alle zugehörigen Fächer/Tests löschen?`)) return;
    await deleteSemester(id);
    onChanged();
  };

  const handleSetActive = async (id) => {
    await setActiveSemester(id);
    onChanged();
  };

  const handleAddSubject = async () => {
    const trimmed = subjectName.trim();
    if (!trimmed || !editSemId) return;
    await addSubject({ name: trimmed, semesterId: editSemId });
    setSubjectName('');
    onChanged();
  };

  const handleDeleteSubject = async (id, name) => {
    if (!confirm(`"${name}" und alle zugehörigen Tests löschen?`)) return;
    await deleteSubject(id);
    onChanged();
  };

  const handleExport = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notentracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Alle bestehenden Daten werden durch den Import ersetzt. Fortfahren?')) {
      fileRef.current.value = '';
      return;
    }
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.subjects || !data.tests) {
      alert('Ungültige Datei.');
      return;
    }
    await importAll(data);
    onChanged();
    fileRef.current.value = '';
  };

  return (
    <>
      <h1>Verwalten</h1>

      {/* --- Semester --- */}
      <h2>Semester</h2>

      {semesters.length === 0 ? (
        <div className="empty" style={{ marginBottom: 12 }}>Noch kein Semester erstellt.</div>
      ) : (
        <div className="card" style={{ marginBottom: 12 }}>
          {semesters.map((s) => (
            <div key={s.id} className="subject-row">
              <span className="subject-name">
                {s.name}
                {s.active && <span className="badge-active">aktiv</span>}
              </span>
              <div className="subject-actions">
                {!s.active && (
                  <button
                    className="activate-btn"
                    onClick={() => handleSetActive(s.id)}
                    title="Als aktiv setzen"
                  >
                    ✓
                  </button>
                )}
                <button className="delete-btn" onClick={() => handleDeleteSemester(s.id, s.name)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary" onClick={handleNewSemester}>
        {nextNumber}. Semester eröffnen
      </button>

      {/* --- Fächer pro Semester --- */}
      {semesters.length > 0 && (
        <>
          <div style={{ marginTop: 32 }} />
          <h2>Fächer</h2>

          {semesters.length > 1 && (
            <div className="semester-switch" style={{ marginBottom: 12 }}>
              {semesters.map((s) => (
                <button
                  key={s.id}
                  className={`sem-chip ${s.id === editSemId ? 'active' : ''}`}
                  onClick={() => setEditSemId(s.id)}
                >
                  {s.name}
                  {s.active && <span className="sem-active-dot" />}
                </button>
              ))}
            </div>
          )}

          <div className="add-row" style={{ marginBottom: 12 }}>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder={`Neues Fach (${viewSem?.name})...`}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
            />
            <button onClick={handleAddSubject}>+</button>
          </div>

          {semSubjects.length === 0 ? (
            <div className="empty">Keine Fächer in {viewSem?.name}.</div>
          ) : (
            <div className="card">
              {semSubjects.map((s, i) => (
                <div key={s.id} className="subject-row">
                  <span className="subject-dot" style={{ background: getSubjectColor(i) }} />
                  <span className="subject-name">{s.name}</span>
                  <div className="subject-actions">
                    <button className="delete-btn" onClick={() => handleDeleteSubject(s.id, s.name)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- Export / Import --- */}
      <div className="data-section">
        <h2>Daten Export / Import</h2>
        <button className="btn btn-secondary" onClick={handleExport}>
          Daten exportieren (JSON)
        </button>
        <label className="btn btn-secondary" style={{ marginTop: 8, cursor: 'pointer' }}>
          Daten importieren (JSON)
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </>
  );
}
