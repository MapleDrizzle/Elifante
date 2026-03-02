import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import type { DaySleep } from '../../hooks/useDashboardData'

type Props = {
  data: DaySleep[]
  loading: boolean
  /** Show only mom, only baby, or both. Default 'both' for home. */
  series?: 'mom' | 'baby' | 'both'
  /** Chart height. Larger for track pages. */
  height?: number
}

const DAY_KEY: Record<string, string> = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' }

export default function SleepChart({
  data,
  loading,
  series = 'both',
  height = 260,
}: Props): JSX.Element {
  const { t } = useTranslation()
  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        {t('sleep.loadingSleep')}
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="dashboard-slide dashboard-slide--empty">
        <p>No sleep data this week. Log sleep in the Sleep section.</p>
      </div>
    )
  }

  const showMom = series === 'mom' || series === 'both'
  const showBaby = series === 'baby' || series === 'both'

  return (
    <div className="dashboard-slide dashboard-slide--chart dashboard-slide--sleep-chart">
      <h3 className="dashboard-slide-title">{t('sleep.weeklySleep')}</h3>
      <p className="dashboard-slide-subtitle">
        {series === 'mom' ? t('sleep.motherHours') : series === 'baby' ? t('sleep.babyHours') : t('sleep.motherVsBaby')}
      </p>
      <div className="sleep-chart-slide-wrap">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 12, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} angle={-25} textAnchor="end" height={48} interval={0} tickFormatter={(v) => t(`days.${DAY_KEY[v] || v.toLowerCase()}`)} />
          <YAxis domain={[0, 12]} tick={{ fontSize: 12 }} unit="h" width={32} />
          <Tooltip formatter={(v: number) => [`${v} h`, '']} />
          {showMom && showBaby && <Legend />}
          {showMom && (
            <Bar
              dataKey="motherHours"
              name={t('sleep.mother')}
              fill="var(--accent)"
              radius={[4, 4, 0, 0]}
            />
          )}
          {showBaby && (
            <Bar
              dataKey="babyHours"
              name={t('sleep.baby')}
              fill="rgba(196, 123, 123, 0.5)"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
