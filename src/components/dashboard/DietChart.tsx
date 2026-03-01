import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { DietSegment } from '../../hooks/useDashboardData'

const FILLED_COLOR = 'var(--accent)'
const EMPTY_COLOR = 'rgba(0,0,0,0.08)'

type Props = {
  data: DietSegment[]
  loading: boolean
  /** Chart height. Larger = less cramped on track page. */
  height?: number
  /** Pie inner/outer radius. Slightly larger = more breathing room. */
  innerRadius?: number
  outerRadius?: number
}

export default function DietChart({
  data,
  loading,
  height = 260,
  innerRadius = 60,
  outerRadius = 100,
}: Props): JSX.Element {
  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        Loading diet data…
      </div>
    )
  }

  const hasAny = data.some((d) => d.filled)

  if (!hasAny) {
    return (
      <div className="dashboard-slide dashboard-slide--empty">
        <p>No meals logged today. Log meals in the Diet section.</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    value: d.value > 0 ? d.value : 0.1,
  }))

  return (
    <div className="dashboard-slide dashboard-slide--chart">
      <h3 className="dashboard-slide-title">Today&apos;s meals</h3>
      <p className="dashboard-slide-subtitle">Logged by meal type</p>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            label={({ name, filled }) => (filled ? name : '')}
          >
            {chartData.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry.filled ? FILLED_COLOR : EMPTY_COLOR}
                stroke="var(--card)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: { payload?: DietSegment }) =>
              props.payload?.filled ? `${props.payload.value} logged` : 'Not logged'
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
