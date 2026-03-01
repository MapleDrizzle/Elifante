import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'
import { useTodayBabyDietMl } from '../../hooks/useDashboardData'

type Props = {
  babyIds: string[]
  /** When true, hide the top descriptive label (for slideshow side‑by‑side). */
  variant?: 'default' | 'slideshow'
}

export default function BabyMlGoalChart({ babyIds, variant = 'default' }: Props): JSX.Element {
  const { totalMl, goalMl, loading } = useTodayBabyDietMl(babyIds)

  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        Loading…
      </div>
    )
  }

  const percent = goalMl > 0 ? Math.min(100, (totalMl / goalMl) * 100) : 0
  const data = [{ name: 'ml', value: percent, fill: 'var(--baby-accent)' }]

  return (
    <div className="dashboard-slide dashboard-slide--chart calorie-goal-chart baby-ml-goal-chart">
      {variant !== 'slideshow' && (
        <p className="calorie-goal-label">Today&apos;s feeding goal (formula / breast milk)</p>
      )}
      <div className="calorie-goal-chart-wrap">
        <ResponsiveContainer width="100%" height={variant === 'slideshow' ? '100%' : 220}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="90%"
            barSize={12}
            data={data}
            startAngle={0}
            endAngle={360}
          >
            <RadialBar
              background
              dataKey="value"
              cornerRadius={7}
              fill="var(--baby-accent)"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="calorie-goal-center" aria-hidden>
          <span className="calorie-goal-current">{totalMl}</span>
          <span className="calorie-goal-sep">/</span>
          <span className="calorie-goal-target">{goalMl}</span>
          <span className="calorie-goal-unit">mL</span>
        </div>
      </div>
    </div>
  )
}
