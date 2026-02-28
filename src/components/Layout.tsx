import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const SIDEBAR_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Diet', path: '/diet' },
  { label: 'Sleep', path: '/sleep' },
  { label: 'Mental', path: '/mental' },
  { label: 'Baby Development', path: '/baby-development' },
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
          {SIDEBAR_ITEMS.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar-item${isActive ? ' sidebar-item--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sidebar-item sidebar-sign-out" onClick={handleSignOut}>
          Sign out
        </button>
      </aside>
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  )
}
