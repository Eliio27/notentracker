import { useState, useEffect, useCallback } from 'react'
import { isLoggedIn, getSemesters, getSubjects, syncQueue } from './api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewTest from './pages/NewTest'
import Calculator from './pages/Calculator'
import Manage from './pages/Manage'
import TestDetail from './pages/TestDetail'

const TABS = [
  { id: 'dashboard', label: 'Übersicht', icon: '◉' },
  { id: 'newtest', label: 'Neuer Test', icon: '+' },
  { id: 'calculator', label: 'Rechner', icon: '⊘' },
  { id: 'manage', label: 'Verwalten', icon: '▤' },
]

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [tab, setTab] = useState('dashboard')
  const [viewTest, setViewTest] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [semesters, setSemesters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [activeSemester, setActiveSemester] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [syncMsg, setSyncMsg] = useState('')

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // Online/Offline Events
  useEffect(() => {
    const goOnline = async () => {
      setOnline(true)
      const count = await syncQueue()
      if (count > 0) {
        setSyncMsg(`${count} Änderung${count > 1 ? 'en' : ''} synchronisiert`)
        setTimeout(() => setSyncMsg(''), 3000)
        refresh()
      }
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [refresh])

  // Daten laden
  useEffect(() => {
    if (!loggedIn) return
    Promise.all([getSemesters(), getSubjects()]).then(([sems, subs]) => {
      setSemesters(sems)
      setSubjects(subs)
      setActiveSemester(sems.find((s) => s.active) || null)
    })
  }, [loggedIn, refreshKey])

  const openTest = (id) => setViewTest(id)
  const closeTest = () => { setViewTest(null); refresh() }
  const onTestAdded = () => { refresh(); setTab('dashboard') }

  if (!loggedIn) return <Login onLogin={() => { setLoggedIn(true); refresh() }} />

  return (
    <div className="app">
      {!online && (
        <div className="offline-banner">
          Offline – Änderungen werden synchronisiert wenn du wieder online bist
        </div>
      )}
      {syncMsg && <div className="sync-banner">{syncMsg}</div>}

      <div className="content">
        {viewTest !== null ? (
          <TestDetail testId={viewTest} onBack={closeTest} subjects={subjects} semesters={semesters} />
        ) : (
          <>
            {tab === 'dashboard' && (
              <Dashboard key={refreshKey} onOpenTest={openTest}
                semesters={semesters} subjects={subjects} activeSemester={activeSemester} />
            )}
            {tab === 'newtest' && (
              <NewTest key={refreshKey} onAdded={onTestAdded}
                semesters={semesters} subjects={subjects} activeSemester={activeSemester} />
            )}
            {tab === 'calculator' && (
              <Calculator key={refreshKey} activeSemester={activeSemester} subjects={subjects} />
            )}
            {tab === 'manage' && (
              <Manage key={refreshKey} onChanged={refresh} semesters={semesters} subjects={subjects}
                onLogout={() => { setLoggedIn(false); setSemesters([]); setSubjects([]) }} />
            )}
          </>
        )}
      </div>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button key={t.id}
            className={`tab-btn ${tab === t.id && !viewTest ? 'active' : ''}`}
            onClick={() => { setViewTest(null); setTab(t.id) }}>
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
