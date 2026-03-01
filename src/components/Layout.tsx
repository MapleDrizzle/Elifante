import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'

const SIDEBAR_ITEMS = [
  { label: 'Home', path: '/', icon: '/images/home_logo.png' },
  { label: 'Diet', path: '/diet', icon: '/images/diet_logo.png' },
  { label: 'Sleep', path: '/sleep', icon: '/images/sleep_logo.png' },
  { label: 'Mental', path: '/mental', icon: '/images/mental_logo.png' },
  { label: 'Baby Development', path: '/baby-development', icon: '/images/baby_logo.png' },
] as const

export default function Layout(): JSX.Element {
  const navigate = useNavigate()
  const { signOut } = useAuth()

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
          Sign out
        </button>
      </aside>
      <div className="app-content">
        <a href="/" className="app-logo-float" aria-label="Elifante home">
          <img src="/images/elifante_logo.png" alt="" aria-hidden />
        </a>
        <Outlet />
      </div>
    </div>
  )
}
