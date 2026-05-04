import { useState, useEffect } from 'react';
import { getSemesters, getSubjects } from './db';
import Dashboard from './pages/Dashboard';
import NewTest from './pages/NewTest';
import Calculator from './pages/Calculator';
import Manage from './pages/Manage';
import TestDetail from './pages/TestDetail';

const TABS = [
  { id: 'dashboard', label: 'Übersicht', icon: '◉' },
  { id: 'newtest', label: 'Neuer Test', icon: '+' },
  { id: 'calculator', label: 'Rechner', icon: '⊘' },
  { id: 'manage', label: 'Verwalten', icon: '▤' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [viewTest, setViewTest] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    Promise.all([getSemesters(), getSubjects()]).then(([sems, subs]) => {
      setSemesters(sems);
      setSubjects(subs);
      const active = sems.find((s) => s.active);
      setActiveSemester(active || null);
    });
  }, [refreshKey]);

  const openTest = (id) => setViewTest(id);
  const closeTest = () => {
    setViewTest(null);
    refresh();
  };

  const onTestAdded = () => {
    refresh();
    setTab('dashboard');
  };

  return (
    <div className="app">
      <div className="content">
        {viewTest !== null ? (
          <TestDetail testId={viewTest} onBack={closeTest} subjects={subjects} semesters={semesters} />
        ) : (
          <>
            {tab === 'dashboard' && (
              <Dashboard
                key={refreshKey}
                onOpenTest={openTest}
                semesters={semesters}
                subjects={subjects}
                activeSemester={activeSemester}
              />
            )}
            {tab === 'newtest' && (
              <NewTest
                key={refreshKey}
                onAdded={onTestAdded}
                semesters={semesters}
                subjects={subjects}
                activeSemester={activeSemester}
              />
            )}
            {tab === 'calculator' && (
              <Calculator
                key={refreshKey}
                activeSemester={activeSemester}
                subjects={subjects}
              />
            )}
            {tab === 'manage' && (
              <Manage key={refreshKey} onChanged={refresh} semesters={semesters} subjects={subjects} />
            )}
          </>
        )}
      </div>
      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id && !viewTest ? 'active' : ''}`}
            onClick={() => { setViewTest(null); setTab(t.id); }}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
