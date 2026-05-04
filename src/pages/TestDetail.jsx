import { useEffect, useState } from 'react'
import { getTest, deleteTest } from '../api'
import { gradeColor, formatDate, getSubjectColor } from '../utils'

export default function TestDetail({ testId, onBack, subjects, semesters }) {
  const [test, setTest] = useState(null)
  const [showPhoto, setShowPhoto] = useState(false)

  useEffect(() => { getTest(testId).then(setTest) }, [testId])

  const handleDelete = async () => {
    if (!confirm('Test wirklich löschen?')) return
    await deleteTest(testId)
    onBack()
  }

  if (!test) return <div className="empty" style={{ marginTop: 40 }}>Lädt…</div>

  const subject = subjects.find((s) => s.id === test.subjectId)
  const subjectIndex = subjects.findIndex((s) => s.id === test.subjectId)
  const semester = semesters.find((s) => s.id === subject?.semesterId)

  return (
    <>
      <button className="back-btn" onClick={onBack}>← Zurück</button>
      <h1>{test.title}</h1>

      <div className="card" style={{ textAlign: 'center' }}>
        <div className="grade-big" style={{ color: gradeColor(test.grade) }}>
          {test.grade.toFixed(1)}
        </div>
      </div>

      <div className="card">
        {semester && (
          <div className="detail-row">
            <span className="detail-label">Semester</span>
            <span>{semester.name}</span>
          </div>
        )}
        <div className="detail-row">
          <span className="detail-label">Fach</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="subject-dot" style={{ background: getSubjectColor(subjectIndex) }} />
            {subject?.name || '–'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Datum</span>
          <span>{formatDate(test.date)}</span>
        </div>
        {test.points != null && test.maxPoints != null && (
          <div className="detail-row">
            <span className="detail-label">Punkte</span>
            <span>{test.points} / {test.maxPoints}</span>
          </div>
        )}
      </div>

      {test.notes && (
        <div className="card">
          <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 4 }}>Notizen</div>
          <div className="note-text">{test.notes}</div>
        </div>
      )}

      {test.photo && (
        <>
          <button className="toggle-photo" onClick={() => setShowPhoto(!showPhoto)}>
            {showPhoto ? 'Foto ausblenden' : 'Foto anzeigen'}
          </button>
          {showPhoto && <img src={test.photo} alt="Test-Foto" className="detail-photo" />}
        </>
      )}

      <button className="btn btn-danger" style={{ marginTop: 24 }} onClick={handleDelete}>
        Test löschen
      </button>
    </>
  )
}
