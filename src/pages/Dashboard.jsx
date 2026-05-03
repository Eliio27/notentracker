import { useEffect, useState } from 'react';
import { getSubjects, getTests } from '../db';
import { gradeColor, average, formatDate, getSubjectColor } from '../utils';

export default function Dashboard({ onOpenTest }) {
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);

  useEffect(() => {
    Promise.all([getSubjects(), getTests()]).then(([s, t]) => {
      setSubjects(s);
      setTests(t.sort((a, b) => new Date(b.date) - new Date(a.date)));
    });
  }, []);

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

  const subjectGrades = subjects.map((s) => {
    const grades = tests.filter((t) => t.subjectId === s.id).map((t) => t.grade);
    const avg = average(grades);
    return { ...s, avg, count: grades.length };
  });

  const allGrades = tests.map((t) => t.grade);
  const totalAvg = average(allGrades);

  const recentTests = tests.slice(0, 5);

  return (
    <>
      <h1>Übersicht</h1>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--text2)', fontSize: 13 }}>Gesamtschnitt</div>
        {allGrades.length > 0 ? (
          <div className="grade-big" style={{ color: gradeColor(totalAvg) }}>
            {totalAvg.toFixed(2)}
          </div>
        ) : (
          <div className="grade-big" style={{ color: 'var(--text2)' }}>–</div>
        )}
        <div style={{ color: 'var(--text2)', fontSize: 12 }}>
          {tests.length} {tests.length === 1 ? 'Test' : 'Tests'} in {subjects.length} {subjects.length === 1 ? 'Fach' : 'Fächern'}
        </div>
      </div>

      {subjectGrades.length > 0 && (
        <>
          <h2>Fächer</h2>
          <div className="card">
            {subjectGrades.map((s, i) => (
              <div key={s.id} className="subject-row">
                <span className="subject-dot" style={{ background: getSubjectColor(i) }} />
                <span className="subject-name">{s.name}</span>
                <span className="subject-grade" style={{ color: s.count ? gradeColor(s.avg) : 'var(--text2)' }}>
                  {s.count ? s.avg.toFixed(2) : '–'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {recentTests.length > 0 && (
        <>
          <h2>Letzte Tests</h2>
          {recentTests.map((t) => (
            <div key={t.id} className="test-card" onClick={() => onOpenTest(t.id)}>
              <span className="subject-dot" style={{
                background: getSubjectColor(subjects.findIndex((s) => s.id === t.subjectId))
              }} />
              <div className="test-info">
                <div className="test-title">{t.title}</div>
                <div className="test-sub">
                  {subjectMap[t.subjectId]?.name} · {formatDate(t.date)}
                </div>
              </div>
              <span className="test-grade" style={{ color: gradeColor(t.grade) }}>
                {t.grade.toFixed(1)}
              </span>
            </div>
          ))}
        </>
      )}

      {subjects.length === 0 && tests.length === 0 && (
        <div className="empty">
          Noch keine Daten.<br />Erstelle zuerst ein Fach unter "Fächer".
        </div>
      )}
    </>
  );
}
