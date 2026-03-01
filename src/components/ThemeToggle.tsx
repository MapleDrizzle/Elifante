import { useTheme } from '../contexts/ThemeContext'

type Props = {
  className?: string
  /** When true, render as a sidebar-style nav item (for Layout). */
  variant?: 'default' | 'sidebar'
}

export default function ThemeToggle({ className = '', variant = 'default' }: Props): JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        className={`sidebar-item theme-toggle theme-toggle--sidebar ${className}`.trim()}
        onClick={toggleTheme}
        aria-label={label}
        title={label}
      >
        <span className="theme-toggle-icon" aria-hidden>
          {isDark ? '☀️' : '🌙'}
        </span>
        <span className="sidebar-item-label theme-toggle-label">
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--float ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <span className="theme-toggle-icon" aria-hidden>
        {isDark ? '☀️' : '🌙'}
      </span>
      <span className="theme-toggle-label-sr">{label}</span>
    </button>
  )
}
