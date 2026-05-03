import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import NewTest from './pages/NewTest';
import Calculator from './pages/Calculator';
import Subjects from './pages/Subjects';
import TestDetail from './pages/TestDetail';

const TABS = [
  { id: 'dashboard', label: 'Übersicht', icon: '◉' },
  { id: 'newtest', label: 'Neuer Test', icon: '+' },
  { id: 'calculator', label: 'Rechner', icon: '⊘' },
  { id: 'subjects', label: 'Fächer', icon: '▤' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [viewTest, setViewTest] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

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
          <TestDetail testId={viewTest} onBack={closeTest} />
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard key={refreshKey} onOpenTest={openTest} />}
            {tab === 'newtest' && <NewTest key={refreshKey} onAdded={onTestAdded} />}
            {tab === 'calculator' && <Calculator key={refreshKey} />}
            {tab === 'subjects' && <Subjects key={refreshKey} onChanged={refresh} />}
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
