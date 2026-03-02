import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useMoodHistory } from '../../hooks/useDashboardData'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_KEY: Record<string, string> = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' }

function getMoodDisplay(rating: number, t: (k: string) => string): { label: string } {
  const labels: Record<number, string> = { 1: t('mental.mad'), 2: t('mental.low'), 3: t('mental.okay'), 4: t('mental.good'), 5: t('mental.happy') }
  return { label: labels[rating] ?? t('mental.okay') }
}

function formatMoodDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

type Props = {
  momId: string | null
}

export default function MoodSlide({ momId }: Props): JSX.Element {
  const { t } = useTranslation()
  const { moods, loading } = useMoodHistory(momId)

  const weeklyChartData = useMemo(() => {
    const data: { day: string; date: string; mood: number; label: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayLabel = DAY_LABELS[d.getDay()]
      const moodsOnDay = moods.filter((m) => m.recorded_at.slice(0, 10) === dateStr)
      const latest =
        moodsOnDay.length > 0
          ? moodsOnDay.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0]
          : null
      const moodVal = latest?.mood ?? 0
      const label = latest ? getMoodDisplay(latest.mood, t).label : '—'
      data.push({ day: dayLabel, date: dateStr, mood: moodVal, label })
    }
    return data
  }, [moods, t])

  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        {t('mental.loadingMood')}
      </div>
    )
  }

  return (
    <div className="dashboard-slide dashboard-slide--chart dashboard-slide--mood-chart">
      <header className="mood-slide-header">
        <h2 className="mood-slide-title">{t('mental.mood')}</h2>
      </header>
      <h3 className="dashboard-slide-title">{t('mental.weekAtGlance')}</h3>
      <p className="dashboard-slide-subtitle">{t('mental.moodByDay')}</p>
      <div className="mood-chart-slide-wrap">
        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={weeklyChartData}
            margin={{ top: 8, right: 16, left: 12, bottom: 32 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} angle={-25} textAnchor="end" height={48} interval={0} />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12 }}
              width={32}
            />
            <Tooltip
              formatter={(value: number) =>
                [value === 0 ? t('mental.noCheckin') : getMoodDisplay(value, t).label, t('mental.mood')]
              }
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.date
                  ? formatMoodDate(payload[0].payload.date)
                  : ''
              }
            />
            <Bar
              dataKey="mood"
              fill="var(--accent)"
              radius={[4, 4, 0, 0]}
              name={t('mental.mood')}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
