import { useEffect, useState } from 'react';
import { getTests } from '../db';
import { gradeColor, average, formatDate, getSubjectColor } from '../utils';

export default function Dashboard({ onOpenTest, semesters, subjects, activeSemester }) {
  const [allTests, setAllTests] = useState([]);
  const [viewSemId, setViewSemId] = useState(activeSemester?.id || null);

  useEffect(() => {
    getTests().then((t) => setAllTests(t.sort((a, b) => new Date(b.date) - new Date(a.date))));
  }, []);

  useEffect(() => {
    if (activeSemester) setViewSemId(activeSemester.id);
  }, [activeSemester]);

  const viewSemester = semesters.find((s) => s.id === viewSemId);
  const semSubjects = subjects.filter((s) => s.semesterId === viewSemId);
  const semSubjectIds = semSubjects.map((s) => s.id);
  const tests = allTests.filter((t) => semSubjectIds.includes(t.subjectId));
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

  const subjectGrades = semSubjects.map((s, i) => {
    const grades = tests.filter((t) => t.subjectId === s.id).map((t) => t.grade);
    return { ...s, avg: average(grades), count: grades.length, colorIdx: i };
  });

  const allGrades = tests.map((t) => t.grade);
  const totalAvg = average(allGrades);
  const recentTests = tests.slice(0, 5);

  if (semesters.length === 0) {
    return (
      <>
        <h1>Übersicht</h1>
        <div className="empty">
          Noch kein Semester erstellt.<br />Gehe zu "Verwalten" und erstelle dein erstes Semester.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="semester-switch">
        {semesters.map((s) => (
          <button
            key={s.id}
            className={`sem-chip ${s.id === viewSemId ? 'active' : ''}`}
            onClick={() => setViewSemId(s.id)}
          >
            {s.name}
            {s.active && <span className="sem-active-dot" />}
          </button>
        ))}
      </div>

      <h1>{viewSemester?.name || 'Übersicht'}</h1>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--text2)', fontSize: 13 }}>Schnitt</div>
        {allGrades.length > 0 ? (
          <div className="grade-big" style={{ color: gradeColor(totalAvg) }}>
            {totalAvg.toFixed(2)}
          </div>
        ) : (
          <div className="grade-big" style={{ color: 'var(--text2)' }}>–</div>
        )}
        <div style={{ color: 'var(--text2)', fontSize: 12 }}>
          {tests.length} {tests.length === 1 ? 'Test' : 'Tests'} in {semSubjects.length} {semSubjects.length === 1 ? 'Fach' : 'Fächern'}
        </div>
      </div>

      {subjectGrades.length > 0 && (
        <>
          <h2>Fächer</h2>
          <div className="card">
            {subjectGrades.map((s) => (
              <div key={s.id} className="subject-row">
                <span className="subject-dot" style={{ background: getSubjectColor(s.colorIdx) }} />
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
          {recentTests.map((t) => {
            const si = semSubjects.findIndex((s) => s.id === t.subjectId);
            return (
              <div key={t.id} className="test-card" onClick={() => onOpenTest(t.id)}>
                <span className="subject-dot" style={{ background: getSubjectColor(si) }} />
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
            );
          })}
        </>
      )}

      {semSubjects.length === 0 && (
        <div className="empty">
          Keine Fächer in diesem Semester.<br />Erstelle Fächer unter "Verwalten".
        </div>
      )}

      {semSubjects.length > 0 && tests.length === 0 && (
        <div className="empty">
          Noch keine Tests in diesem Semester.
        </div>
      )}
    </>
  );
}
