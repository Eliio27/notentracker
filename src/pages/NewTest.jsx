import { useState } from 'react';
import { addTest } from '../db';

export default function NewTest({ onAdded, semesters, subjects, activeSemester }) {
  const defaultSemId = activeSemester?.id || (semesters[0]?.id ?? '');
  const [semesterId, setSemesterId] = useState(defaultSemId);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [grade, setGrade] = useState('');
  const [points, setPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);

  const semSubjects = subjects.filter((s) => s.semesterId === Number(semesterId));

  // Setze erstes Fach wenn Semester wechselt
  const currentSubjectValid = semSubjects.some((s) => s.id === Number(subjectId));
  const effectiveSubjectId = currentSubjectValid ? subjectId : (semSubjects[0]?.id ?? '');

  if (!currentSubjectValid && semSubjects.length > 0 && subjectId !== String(semSubjects[0].id)) {
    // will update on next render
  }

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sid = effectiveSubjectId || subjectId;
    if (!title || !sid || !grade) return;
    const g = parseFloat(grade);
    if (g < 1 || g > 6) return;

    await addTest({
      title,
      subjectId: Number(sid),
      grade: g,
      points: points ? parseFloat(points) : null,
      maxPoints: maxPoints ? parseFloat(maxPoints) : null,
      date,
      notes,
      photo,
    });
    onAdded();
  };

  if (semesters.length === 0) {
    return (
      <>
        <h1>Neuer Test</h1>
        <div className="empty">Erstelle zuerst ein Semester unter "Verwalten".</div>
      </>
    );
  }

  return (
    <>
      <h1>Neuer Test</h1>

      <form onSubmit={handleSubmit}>
        {/* Semester-Auswahl (für Nachtragen) */}
        <div className="form-group">
          <label>Semester {semesterId != activeSemester?.id && <span style={{ color: 'var(--yellow)', fontSize: 11 }}> (Nachtragen)</span>}</label>
          <select value={semesterId} onChange={(e) => { setSemesterId(e.target.value); setSubjectId(''); }}>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.active ? ' (aktiv)' : ''}
              </option>
            ))}
          </select>
        </div>

        {semSubjects.length === 0 ? (
          <div className="empty">Keine Fächer in diesem Semester. Erstelle Fächer unter "Verwalten".</div>
        ) : (
          <>
            <div className="form-group">
              <label>Fach</label>
              <select value={effectiveSubjectId} onChange={(e) => setSubjectId(e.target.value)}>
                {semSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Elektrotechnik Prüfung 1"
                required
              />
            </div>

            <div className="form-group">
              <label>Note (1.0 – 6.0)</label>
              <input
                type="number"
                min="1"
                max="6"
                step="0.1"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="4.5"
                required
              />
            </div>

            <div className="inline-row">
              <div className="form-group">
                <label>Punkte (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="38"
                />
              </div>
              <div className="form-group">
                <label>Max. Punkte</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(e.target.value)}
                  placeholder="45"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Notizen</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Freitext..."
              />
            </div>

            <div className="form-group">
              <label>Foto (optional)</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhoto}
              />
              {photo && <img src={photo} alt="Vorschau" className="photo-preview" />}
            </div>

            <button type="submit" className="btn btn-primary">Test speichern</button>
          </>
        )}
      </form>
    </>
  );
}
