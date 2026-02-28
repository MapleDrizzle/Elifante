import { NavLink, Outlet } from 'react-router-dom'

const SIDEBAR_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Diet', path: '/diet' },
  { label: 'Sleep', path: '/sleep' },
  { label: 'Mental', path: '/mental' },
  { label: 'Baby Development', path: '/baby-development' },
] as const

export default function Layout(): JSX.Element {
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
      </aside>
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  )
}
