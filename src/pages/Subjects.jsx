import { useEffect, useState, useRef } from 'react';
import { getSubjects, addSubject, deleteSubject, exportAll, importAll } from '../db';
import { getSubjectColor } from '../utils';

export default function Subjects({ onChanged }) {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState('');
  const fileRef = useRef();

  const load = () => getSubjects().then(setSubjects);

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await addSubject({ name: trimmed });
    setName('');
    await load();
    onChanged();
  };

  const handleDelete = async (id, subjectName) => {
    if (!confirm(`"${subjectName}" und alle zugehörigen Tests löschen?`)) return;
    await deleteSubject(id);
    await load();
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
    await load();
    onChanged();
    fileRef.current.value = '';
  };

  return (
    <>
      <h1>Fächer</h1>

      <div className="add-row" style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Neues Fach..."
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd}>+</button>
      </div>

      {subjects.length === 0 ? (
        <div className="empty">Noch keine Fächer angelegt.</div>
      ) : (
        <div className="card">
          {subjects.map((s, i) => (
            <div key={s.id} className="subject-row">
              <span className="subject-dot" style={{ background: getSubjectColor(i) }} />
              <span className="subject-name">{s.name}</span>
              <div className="subject-actions">
                <button className="delete-btn" onClick={() => handleDelete(s.id, s.name)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

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
