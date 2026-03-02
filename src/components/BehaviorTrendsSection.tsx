import { useState, useMemo } from 'react'
import {
  useTodayDietCalories,
  useTodayDietEntries,
  useMoodHistory,
  useWeeklySleep,
} from '../hooks/useDashboardData'
import {
  fetchMomBehaviorAdvice,
  type MomBehaviorStats,
  type TrendCategory,
} from '../lib/advice'

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ?? import.meta.env.VITE_GOOGLE_GEMINI_API_KEY

type Props = {
  momId: string | null
  babyIds: string[]
}

type TrendStatus = 'good' | 'needs-attention'

function TrendCard({
  title,
  status,
  statusLabel,
  category,
  stats,
}: {
  title: string
  status: TrendStatus
  statusLabel: string
  category: TrendCategory
  stats: MomBehaviorStats
}) {
  const [advice, setAdvice] = useState<string | null>(null)
  const [resourceLink, setResourceLink] = useState<string | null>(null)
  const [resourceLabel, setResourceLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    const key = GEMINI_API_KEY?.trim()
    if (!key) {
      setError('API key not configured. Add VITE_GEMINI_API_KEY to .env')
      return
    }
    setError(null)
    setAdvice(null)
    setResourceLink(null)
    setResourceLabel(null)
    setLoading(true)
    try {
      const result = await fetchMomBehaviorAdvice(key, stats, category)
      setAdvice(result.suggestion)
      setResourceLink(result.resourceLink ?? null)
      setResourceLabel(result.resourceLabel ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get advice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`behavior-trend-card behavior-trend-card--${status}`}
      data-category={category}
    >
      <h4 className="behavior-trend-title">{title}</h4>
      <p className="behavior-trend-status">{statusLabel}</p>
      <button
        type="button"
        className="behavior-trend-advice-btn"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? 'Getting advice…' : 'Get personalized advice'}
      </button>
      {advice && (
        <div className="behavior-trend-advice" role="status">
          <p className="behavior-trend-advice-text">{advice}</p>
          {resourceLink && resourceLabel && (
            <a
              href={resourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="behavior-trend-resource-link"
            >
              {resourceLabel} →
            </a>
          )}
        </div>
      )}
      {error && (
        <p className="behavior-trend-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default function BehaviorTrendsSection({ momId, babyIds }: Props): JSX.Element {
  const { totalCalories, goal, loading: dietCalLoading } = useTodayDietCalories(momId)
  const { entries: dietEntries } = useTodayDietEntries(momId)
  const { moods, loading: moodLoading } = useMoodHistory(momId)
  const { data: sleepData, loading: sleepLoading } = useWeeklySleep(momId, babyIds)

  const stats = useMemo((): MomBehaviorStats | null => {
    if (!momId) return null

    const recentFoods = dietEntries.map((e) => e.food?.trim()).filter(Boolean) as string[]
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const moodDaysThisWeek = new Set(
      moods
        .filter((m) => new Date(m.recorded_at) >= weekAgo)
        .map((m) => m.recorded_at.slice(0, 10))
    ).size
    const avgMotherHours =
      sleepData.length > 0
        ? sleepData.reduce((s, d) => s + d.motherHours, 0) / sleepData.length
        : 0
    const daysWithLowSleep = sleepData.filter((d) => d.motherHours < 6).length

    return {
      diet: {
        totalCalories,
        goal,
        recentFoods,
      },
      mood: {
        daysLoggedThisWeek: moodDaysThisWeek,
        totalDays: 7,
      },
      sleep: {
        avgMotherHoursPerDay: avgMotherHours,
        daysWithLowSleep,
      },
    }
  }, [momId, totalCalories, goal, dietEntries, moods, sleepData])

  const loading = dietCalLoading || moodLoading || sleepLoading

  if (!momId || loading) {
    return (
      <div className="behavior-trends-section">
        <h3 className="behavior-trends-title">Your trends</h3>
        <p className="behavior-trends-loading">Loading trends…</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="behavior-trends-section">
        <h3 className="behavior-trends-title">Your trends</h3>
        <p className="behavior-trends-empty">Sign in to see your trends.</p>
      </div>
    )
  }

  const dietStatus: TrendStatus = totalCalories >= goal * 0.8 ? 'good' : 'needs-attention'
  const dietLabel =
    dietStatus === 'good'
      ? `Meeting calorie goal (${totalCalories}/${goal} cal)`
      : `Below calorie goal (${totalCalories}/${goal} cal)`

  const moodStatus: TrendStatus = stats.mood.daysLoggedThisWeek >= 4 ? 'good' : 'needs-attention'
  const moodLabel =
    moodStatus === 'good'
      ? `Consistent logging (${stats.mood.daysLoggedThisWeek}/7 days)`
      : `Inconsistent logging (${stats.mood.daysLoggedThisWeek}/7 days)`

  const sleepStatus: TrendStatus = stats.sleep.avgMotherHoursPerDay >= 6 ? 'good' : 'needs-attention'
  const sleepLabel =
    sleepStatus === 'good'
      ? `Adequate sleep (${stats.sleep.avgMotherHoursPerDay.toFixed(1)} hrs avg)`
      : `Sleep deprived (${stats.sleep.avgMotherHoursPerDay.toFixed(1)} hrs avg)`

  return (
    <div className="behavior-trends-section">
      <h3 className="behavior-trends-title">Your trends</h3>
      <p className="behavior-trends-subtitle">Personalized insights from your logged data</p>
      <div className="behavior-trends-grid">
        <TrendCard
          title="Diet"
          status={dietStatus}
          statusLabel={dietLabel}
          category="diet"
          stats={stats}
        />
        <TrendCard
          title="Mood"
          status={moodStatus}
          statusLabel={moodLabel}
          category="mood"
          stats={stats}
        />
        <TrendCard
          title="Sleep"
          status={sleepStatus}
          statusLabel={sleepLabel}
          category="sleep"
          stats={stats}
        />
      </div>
    </div>
  )
}
