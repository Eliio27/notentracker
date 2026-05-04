import { useState } from 'react'
import { login } from '../api'

export default function Login({ onLogin }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      await login(code)
      onLogin()
    } catch (err) {
      setError('Verbindung fehlgeschlagen. Bitte Internetverbindung prüfen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-icon">
          <svg width="72" height="72" viewBox="0 0 192 192">
            <rect width="192" height="192" rx="34" fill="#e94560" />
            <text x="96" y="100" fontFamily="sans-serif" fontWeight="bold" fontSize="100"
              fill="#fff" textAnchor="middle" dominantBaseline="central">6</text>
          </svg>
        </div>

        <h1 className="login-title">Notentracker</h1>
        <p className="login-sub">Berufsschule · Schweizer Notensystem</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">Dein persönlicher Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="z.B. abc123"
            className="login-input"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading || !code.trim()}>
            {loading ? 'Verbinde…' : 'Einloggen / Registrieren'}
          </button>
        </form>

        <p className="login-hint">
          Kein Konto? Wähle einfach einen beliebigen Code — beim ersten Einloggen wird er automatisch erstellt.
        </p>
      </div>
    </div>
  )
}
