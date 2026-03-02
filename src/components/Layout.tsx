import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'
import LanguageSwitcher from './LanguageSwitcher'

export default function Layout(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()
  const isHome = location.pathname === '/'

  const SIDEBAR_ITEMS = [
    { label: t('app.home'), path: '/', icon: '/images/home_logo.png' },
    { label: t('app.diet'), path: '/diet', icon: '/images/diet_logo.png' },
    { label: t('app.sleep'), path: '/sleep', icon: '/images/sleep_logo.png' },
    { label: t('app.mental'), path: '/mental', icon: '/images/mental_logo.png' },
    { label: t('app.babyDevelopment'), path: '/baby-development', icon: '/images/baby_logo.png' },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="sidebar-title">Elifante</h2>
        <nav className="sidebar-nav">
          <ThemeToggle variant="sidebar" />
          <LanguageSwitcher variant="sidebar" />
          {SIDEBAR_ITEMS.map(({ label, path, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar-item${isActive ? ' sidebar-item--active' : ''}`
              }
            >
              <img src={icon} alt="" className="sidebar-item-icon" aria-hidden />
              <span className="sidebar-item-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sidebar-item sidebar-sign-out" onClick={handleSignOut}>
          {t('common.signOut')}
        </button>
      </aside>
      <div className={`app-content${isHome ? ' app-content--home' : ''}`}>
        <a href="/" className="app-logo-float" aria-label="Elifante home">
          <img src="/images/elifante_logo.png" alt="" aria-hidden />
        </a>
        <Outlet />
      </div>
    </div>
  )
}
