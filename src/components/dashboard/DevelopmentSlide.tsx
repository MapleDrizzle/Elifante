import { useTranslation } from 'react-i18next'
import type { BabyDevelopmentInfo } from '../../hooks/useDashboardData'

type Props = {
  data: BabyDevelopmentInfo | null
  loading: boolean
}

export default function DevelopmentSlide({ data, loading }: Props): JSX.Element {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        {t('babyDev.loadingDev')}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="dashboard-slide dashboard-slide--empty">
        <p>{t('babyDev.addBabyFirst')}</p>
      </div>
    )
  }

  const { weightKg, heightCm, ageMonths, babyName, milestones } = data

  return (
    <div className="dashboard-slide dashboard-slide--dev">
      <h3 className="dashboard-slide-title">{t('babyDev.title')}</h3>
      <p className="dashboard-slide-subtitle">{babyName}</p>
      <div className="dev-grid">
        {weightKg != null && (
          <div className="dev-stat">
            <span className="dev-stat-value">{weightKg} kg</span>
            <span className="dev-stat-label">{t('babyDev.weight')}</span>
          </div>
        )}
        {heightCm != null && (
          <div className="dev-stat">
            <span className="dev-stat-value">{heightCm} cm</span>
            <span className="dev-stat-label">{t('babyDev.height')}</span>
          </div>
        )}
        <div className="dev-stat">
          <span className="dev-stat-value">{ageMonths} mo</span>
          <span className="dev-stat-label">{t('babyDev.age')}</span>
        </div>
      </div>
      {milestones.length > 0 && (
        <div className="dev-milestones">
          <h4>{t('babyDev.recentMilestones')}</h4>
          <ul>
            {milestones.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      {weightKg == null && heightCm == null && milestones.length === 0 && (
        <p className="dashboard-slide-empty-text">{t('babyDev.logInBabyDev')}</p>
      )}
    </div>
  )
}
