import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'
import { useTodayDietCalories } from '../../hooks/useDashboardData'

type Props = {
  momId: string | null
  /** When true, hide the top descriptive label (for slideshow side‑by‑side). */
  variant?: 'default' | 'slideshow'
}

export default function CalorieGoalChart({ momId, variant = 'default' }: Props): JSX.Element {
  const { totalCalories, goal, loading } = useTodayDietCalories(momId)

  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        Loading…
      </div>
    )
  }

  const percent = goal > 0 ? Math.min(100, (totalCalories / goal) * 100) : 0
  const data = [{ name: 'calories', value: percent, fill: 'var(--accent)' }]

  return (
    <div className="dashboard-slide dashboard-slide--chart calorie-goal-chart">
      {variant !== 'slideshow' && (
        <p className="calorie-goal-label">Log what you eat to reach your daily calorie goal</p>
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
              fill="var(--accent)"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="calorie-goal-center" aria-hidden>
          <span className="calorie-goal-current">{totalCalories}</span>
          <span className="calorie-goal-sep">/</span>
          <span className="calorie-goal-target">{goal}</span>
          <span className="calorie-goal-unit">cal</span>
        </div>
      </div>
    </div>
  )
}
