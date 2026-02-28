import type { BabyDevelopmentInfo } from '../../hooks/useDashboardData'

type Props = {
  data: BabyDevelopmentInfo | null
  loading: boolean
}

export default function DevelopmentSlide({ data, loading }: Props): JSX.Element {
  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        Loading development…
      </div>
    )
  }

  if (!data) {
    return (
      <div className="dashboard-slide dashboard-slide--empty">
        <p>Add a baby in your profile to see development here.</p>
      </div>
    )
  }

  const { weightKg, heightCm, ageMonths, babyName, milestones } = data

  return (
    <div className="dashboard-slide dashboard-slide--dev">
      <h3 className="dashboard-slide-title">Baby development</h3>
      <p className="dashboard-slide-subtitle">{babyName}</p>
      <div className="dev-grid">
        {weightKg != null && (
          <div className="dev-stat">
            <span className="dev-stat-value">{weightKg} kg</span>
            <span className="dev-stat-label">Weight</span>
          </div>
        )}
        {heightCm != null && (
          <div className="dev-stat">
            <span className="dev-stat-value">{heightCm} cm</span>
            <span className="dev-stat-label">Height</span>
          </div>
        )}
        <div className="dev-stat">
          <span className="dev-stat-value">{ageMonths} mo</span>
          <span className="dev-stat-label">Age</span>
        </div>
      </div>
      {milestones.length > 0 && (
        <div className="dev-milestones">
          <h4>Recent milestones</h4>
          <ul>
            {milestones.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      {weightKg == null && heightCm == null && milestones.length === 0 && (
        <p className="dashboard-slide-empty-text">Log height, weight, and milestones in Baby Development.</p>
      )}
    </div>
  )
}
