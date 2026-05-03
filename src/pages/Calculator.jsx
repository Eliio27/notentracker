import { useEffect, useState } from 'react';
import { getSubjects, getTestsBySubject } from '../db';
import { average, gradeColor } from '../utils';

export default function Calculator() {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [currentGrades, setCurrentGrades] = useState([]);
  const [targetGrade, setTargetGrade] = useState('');
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    getSubjects().then((s) => {
      setSubjects(s);
      if (s.length > 0) setSubjectId(String(s[0].id));
    });
  }, []);

  useEffect(() => {
    if (!subjectId) return;
    getTestsBySubject(Number(subjectId)).then((tests) => {
      setCurrentGrades(tests.map((t) => t.grade));
    });
  }, [subjectId]);

  const currentAvg = average(currentGrades);
  const currentCount = currentGrades.length;

  let result = null;
  if (targetGrade && remaining && Number(remaining) > 0) {
    const target = parseFloat(targetGrade);
    const rem = parseInt(remaining);
    const totalNeeded = target * (currentCount + rem);
    const currentSum = currentGrades.reduce((a, b) => a + b, 0);
    const neededSum = totalNeeded - currentSum;
    const neededAvg = neededSum / rem;

    if (neededAvg > 6) {
      result = { reachable: false, needed: neededAvg };
    } else if (neededAvg < 1) {
      result = { reachable: true, needed: 1, easy: true };
    } else {
      result = { reachable: true, needed: neededAvg };
    }
  }

  return (
    <>
      <h1>Notenrechner</h1>

      {subjects.length === 0 ? (
        <div className="empty">Erstelle zuerst ein Fach unter "Fächer".</div>
      ) : (
        <>
          <div className="form-group">
            <label>Fach</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>Aktueller Schnitt</div>
            <div className="grade-big" style={{ color: currentCount ? gradeColor(currentAvg) : 'var(--text2)', fontSize: 36 }}>
              {currentCount ? currentAvg.toFixed(2) : '–'}
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 12 }}>
              {currentCount} {currentCount === 1 ? 'Test' : 'Tests'} erfasst
            </div>
          </div>

          <div className="form-group">
            <label>Wunschnote</label>
            <input
              type="number"
              min="1"
              max="6"
              step="0.1"
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
              placeholder="5.0"
            />
          </div>

          <div className="form-group">
            <label>Anzahl verbleibende Tests</label>
            <input
              type="number"
              min="1"
              step="1"
              value={remaining}
              onChange={(e) => setRemaining(e.target.value)}
              placeholder="3"
            />
          </div>

          {result && !result.reachable && (
            <div className="warning">
              Nicht erreichbar. Du bräuchtest einen Schnitt von {result.needed.toFixed(2)} in den
              verbleibenden Tests — das Maximum ist 6.0.
            </div>
          )}

          {result && result.reachable && (
            <div className={`result ${result.needed > 5 ? '' : ''}`}>
              {result.easy ? (
                <>Deine Wunschnote ist bereits gesichert, selbst mit der Minimalnote 1.0.</>
              ) : (
                <>
                  Du brauchst einen Schnitt von{' '}
                  <strong>{result.needed.toFixed(2)}</strong> in den verbleibenden{' '}
                  {remaining} Tests.
                </>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
