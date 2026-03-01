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
import type { DaySleep } from '../../hooks/useDashboardData'

type Props = {
  data: DaySleep[]
  loading: boolean
  /** Show only mom, only baby, or both. Default 'both' for home. */
  series?: 'mom' | 'baby' | 'both'
  /** Chart height. Larger for track pages. */
  height?: number
}

export default function SleepChart({
  data,
  loading,
  series = 'both',
  height = 260,
}: Props): JSX.Element {
  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        Loading sleep data…
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
    <div className="dashboard-slide dashboard-slide--chart">
      <h3 className="dashboard-slide-title">Weekly sleep</h3>
      <p className="dashboard-slide-subtitle">
        {series === 'mom' ? 'Mother (hours)' : series === 'baby' ? 'Baby (hours)' : 'Mother vs baby (hours)'}
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 24]} tick={{ fontSize: 12 }} unit="h" />
          <Tooltip formatter={(v: number) => [`${v} h`, '']} />
          {showMom && showBaby && <Legend />}
          {showMom && (
            <Bar
              dataKey="motherHours"
              name="Mother"
              fill="var(--accent)"
              radius={[4, 4, 0, 0]}
            />
          )}
          {showBaby && (
            <Bar
              dataKey="babyHours"
              name="Baby"
              fill="rgba(196, 123, 123, 0.5)"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
