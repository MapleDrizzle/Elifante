import { useTodayDietEntries } from '../../hooks/useDashboardData'
import type { MotherDiet } from '../../types/database'

function getQualityLabel(quality: number | null): string {
  if (quality == null) return '—'
  if (quality <= 2) return 'Poor'
  if (quality <= 4) return 'Good'
  return 'Great'
}

function getQualityClass(quality: number | null): string {
  if (quality == null) return 'diet-log-quality--none'
  if (quality <= 2) return 'diet-log-quality--poor'
  if (quality <= 4) return 'diet-log-quality--good'
  return 'diet-log-quality--great'
}

function formatTime(recordedAt: string): string {
  const d = new Date(recordedAt)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function mealLabel(meal: string | null): string {
  if (!meal) return ''
  const labels: Record<string, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    other: 'Other',
  }
  return labels[meal] ?? meal
}

type Props = {
  momId: string | null
}

export default function DietTodayList({ momId }: Props): JSX.Element {
  const { entries, loading } = useTodayDietEntries(momId)

  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        Loading meals…
      </div>
    )
  }

  if (!entries.length) {
    return (
      <div className="dashboard-slide dashboard-slide--empty">
        <p>No meals logged today. Use “Add meal (mom)” below to log.</p>
      </div>
    )
  }

  return (
    <div className="dashboard-slide diet-today-list">
      <ul className="diet-log" aria-label="Today's meals">
        {entries.map((entry: MotherDiet) => (
          <li key={entry.id} className="diet-log-item">
            <span className="diet-log-time" aria-label="Time">
              {formatTime(entry.recorded_at)}
            </span>
            <span className="diet-log-food">{entry.food?.trim() || 'Meal'}</span>
            {entry.meal && (
              <span className="diet-log-meal">{mealLabel(entry.meal)}</span>
            )}
            <span
              className={`diet-log-quality ${getQualityClass(entry.food_quality)}`}
              aria-label={`Quality: ${getQualityLabel(entry.food_quality)}`}
            >
              {getQualityLabel(entry.food_quality)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
