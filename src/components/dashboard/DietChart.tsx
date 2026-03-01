import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { DietSegment } from '../../hooks/useDashboardData'

/** Poor / Good / Great use palette vars so segments are adjacent when sorted. */
function getQualityColor(quality: number): string {
  const q = Math.max(1, Math.min(5, quality))
  if (q <= 2) return 'var(--diet-poor)'
  if (q <= 4) return 'var(--diet-good)'
  return 'var(--diet-great)'
}

function getQualityLabel(quality: number): string {
  if (quality <= 2) return 'Poor'
  if (quality <= 4) return 'Good'
  return 'Great'
}

/** Sort key: Poor first (1–2), then Good (3–4), then Great (5). */
function qualitySortKey(quality: number): number {
  if (quality <= 2) return 0
  if (quality <= 4) return 1
  return 2
}

const LEGEND_ITEMS: { label: string; quality: number }[] = [
  { label: 'Poor', quality: 1 },
  { label: 'Good', quality: 3 },
  { label: 'Great', quality: 5 },
]

type Props = {
  data: DietSegment[]
  loading: boolean
  height?: number
  innerRadius?: number
  outerRadius?: number
  /** When 'slideshow', no tooltip, no hover expand; just pie + legend. */
  variant?: 'default' | 'slideshow'
}

export default function DietChart({
  data,
  loading,
  height = 260,
  innerRadius = 60,
  outerRadius = 100,
  variant = 'default',
}: Props): JSX.Element {
  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        Loading diet data…
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="dashboard-slide dashboard-slide--empty">
        <p>No meals logged today. Log meals in the Diet section.</p>
      </div>
    )
  }

  const isSlideshow = variant === 'slideshow'

  // Sort by quality so Poor, Good, Great are adjacent (dark → neutral → light)
  const chartData = [...data].sort(
    (a, b) => qualitySortKey(a.quality) - qualitySortKey(b.quality)
  )

  return (
    <div
      className={`dashboard-slide dashboard-slide--chart diet-chart-with-legend ${isSlideshow ? 'diet-chart--slideshow' : ''}`}
    >
      <h3 className="dashboard-slide-title">Today&apos;s meals</h3>
      <p className="dashboard-slide-subtitle">Each slice is one food</p>
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
            isAnimationActive={!isSlideshow}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.id}
                fill={getQualityColor(entry.quality)}
                stroke="var(--card)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          {!isSlideshow && (
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as DietSegment
                return (
                  <div
                    className="recharts-default-tooltip"
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                  >
                    <strong>{p.name}</strong> — {getQualityLabel(p.quality)}
                  </div>
                )
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      <div className="diet-chart-legend" aria-label="Quality scale">
        {LEGEND_ITEMS.map(({ label, quality }) => (
          <span key={label} className="diet-chart-legend-item">
            <span
              className="diet-chart-legend-swatch"
              style={{ backgroundColor: getQualityColor(quality) }}
              aria-hidden
            />
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
