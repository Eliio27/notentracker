import { useEffect, useState } from 'react';
import { getSubjects, addTest } from '../db';

export default function NewTest({ onAdded }) {
  const [subjects, setSubjects] = useState([]);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [grade, setGrade] = useState('');
  const [points, setPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    getSubjects().then((s) => {
      setSubjects(s);
      if (s.length > 0) setSubjectId(String(s[0].id));
    });
  }, []);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !subjectId || !grade) return;
    const g = parseFloat(grade);
    if (g < 1 || g > 6) return;

    await addTest({
      title,
      subjectId: Number(subjectId),
      grade: g,
      points: points ? parseFloat(points) : null,
      maxPoints: maxPoints ? parseFloat(maxPoints) : null,
      date,
      notes,
      photo,
    });
    onAdded();
  };

  return (
    <>
      <h1>Neuer Test</h1>

      {subjects.length === 0 ? (
        <div className="empty">Erstelle zuerst ein Fach unter "Fächer".</div>
      ) : (
        <form onSubmit={handleSubmit}>
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
            <label>Fach</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
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
        </form>
      )}
    </>
  );
}
