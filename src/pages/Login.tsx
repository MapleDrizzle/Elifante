import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import LanguageSwitcher from '../components/LanguageSwitcher'
import './Login.css'

export default function Login(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, error, clearError } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      if (isSignUp) {
        await signUp(email, password, username || undefined)
      } else {
        await signIn(email, password)
      }
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch {
      // error is set in context
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <ThemeToggle className="login-theme-toggle" />
      <LanguageSwitcher className="login-lang-switcher" />
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo-wrap">
            <img
              src="/images/elifante_logo.png"
              alt="Elifante"
              className="login-logo"
            />
          </div>
          <p className="login-subtitle">{t('login.subtitle')}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label className="login-label">
              {t('login.nameOptional')}
              <input
                type="text"
                className="login-input"
                placeholder={t('login.namePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="name"
              />
            </label>
          )}

          <label className="login-label">
            Email
            <input
              type="email"
              className="login-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="login-label">
            {t('login.password')}
            <input
              type="password"
              className="login-input"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? t('login.pleaseWait') : isSignUp ? t('login.createAccount') : t('login.signIn')}
          </button>
        </form>

        <p className="login-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="login-toggle-btn"
            onClick={() => {
              clearError()
              setIsSignUp((v) => !v)
            }}
          >
            {isSignUp ? t('login.signIn') : t('login.signUp')}
          </button>
        </p>
      </div>
    </div>
  )
}
