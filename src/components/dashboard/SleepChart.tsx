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
}

export default function SleepChart({ data, loading }: Props): JSX.Element {
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

  return (
    <div className="dashboard-slide dashboard-slide--chart">
      <h3 className="dashboard-slide-title">Weekly sleep</h3>
      <p className="dashboard-slide-subtitle">Mother vs baby (hours)</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 24]} tick={{ fontSize: 12 }} unit="h" />
          <Tooltip formatter={(v: number) => [`${v} h`, '']} />
          <Legend />
          <Bar dataKey="motherHours" name="Mother" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="babyHours" name="Baby" fill="rgba(196, 123, 123, 0.5)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
