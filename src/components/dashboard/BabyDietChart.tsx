import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BabyDayDiet } from '../../hooks/useDashboardData'

type Props = {
  data: BabyDayDiet[]
  loading: boolean
  height?: number
}

export default function BabyDietChart({
  data,
  loading,
  height = 280,
}: Props): JSX.Element {
  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        Loading…
      </div>
    )
  }

  const hasAny = data.some((d) => d.count > 0)

  if (!hasAny) {
    return (
      <div className="dashboard-slide dashboard-slide--empty">
        <p>No feedings logged this week. Log meals in the Diet section.</p>
      </div>
    )
  }

  return (
    <div className="dashboard-slide dashboard-slide--chart">
      <h3 className="dashboard-slide-title">Feedings this week</h3>
      <p className="dashboard-slide-subtitle">By day</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip formatter={(v: number) => [`${v} feeding(s)`, 'Count']} />
          <Bar
            dataKey="count"
            name="Feedings"
            fill="rgba(196, 123, 123, 0.6)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
