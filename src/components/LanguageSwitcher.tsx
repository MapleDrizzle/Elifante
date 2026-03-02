import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n'

type Props = {
  className?: string
  variant?: 'default' | 'sidebar'
}

export default function LanguageSwitcher({ className = '', variant = 'default' }: Props): JSX.Element {
  const { i18n } = useTranslation()
  const current = (i18n.language?.slice(0, 2) || 'en') as SupportedLanguage
  const next = SUPPORTED_LANGUAGES[(SUPPORTED_LANGUAGES.findIndex((l) => l.code === current) + 1) % SUPPORTED_LANGUAGES.length]

  const handleClick = () => {
    i18n.changeLanguage(next.code)
  }

  const label = `Language: ${SUPPORTED_LANGUAGES.find((l) => l.code === current)?.label ?? 'English'} (switch to ${next.label})`

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        className={`sidebar-item theme-toggle theme-toggle--sidebar language-switcher ${className}`.trim()}
        onClick={handleClick}
        aria-label={label}
        title={label}
      >
        <span className="theme-toggle-icon" aria-hidden>
          🌐
        </span>
        <span className="sidebar-item-label theme-toggle-label">
          {SUPPORTED_LANGUAGES.find((l) => l.code === current)?.label ?? 'EN'}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`language-switcher language-switcher--float ${className}`.trim()}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <span className="theme-toggle-icon" aria-hidden>
        🌐
      </span>
      <span className="theme-toggle-label-sr">{label}</span>
    </button>
  )
}
