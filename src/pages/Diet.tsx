import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTodayBabyDietEntries } from '../hooks/useDashboardData'
import CalorieGoalChart from '../components/dashboard/CalorieGoalChart'
import BabyMlGoalChart from '../components/dashboard/BabyMlGoalChart'
import DietTodayList from '../components/dashboard/DietTodayList'
import '../styles/TrackPage.css'

export default function Diet(): JSX.Element {
  const { mom, babies } = useAuth()
  const momId = mom?.id ?? null
  const babyIds = babies.map((b) => b.id)
  const { entries: todayBabyEntries, loading: todayBabyLoading } = useTodayBabyDietEntries(babyIds)

  return (
    <>
      <header className="app-header">
        <h1>Diet</h1>
        <p>Track your nutrition and your baby&apos;s meals</p>
      </header>
      <main className="app-main track-page">
        <div className="track-charts">
          <div className="track-chart-card track-chart-card--diet">
            <h3 className="track-chart-title">Mom – today&apos;s calorie goal</h3>
            <CalorieGoalChart momId={momId} />
          </div>
          <div className="track-chart-card track-chart-card--diet">
            <h3 className="track-chart-title">Baby – today&apos;s intake</h3>
            {babies.length === 0 ? (
              <div className="track-chart-placeholder">
                Add a baby to track
              </div>
            ) : (
              <BabyMlGoalChart babyIds={babyIds} />
            )}
          </div>
        </div>

        <div className="track-buttons">
          <Link to="/diet/add-mom" className="track-btn">
            Add meal (mom)
          </Link>
          <Link to="/diet/add-baby" className="track-btn">
            Add meal (baby)
          </Link>
        </div>

        <section className="diet-today-logs" aria-label="Today's diet logs">
          <h3 className="diet-today-logs-title">Today&apos;s logs</h3>
          <div className="diet-today-logs-grid">
            <div className="diet-today-logs-col">
              <h4 className="diet-today-logs-col-title">Mom</h4>
              <DietTodayList momId={momId} />
            </div>
            <div className="diet-today-logs-col">
              <h4 className="diet-today-logs-col-title">Baby</h4>
              {todayBabyLoading ? (
                <p className="diet-today-logs-loading">Loading…</p>
              ) : todayBabyEntries.length === 0 ? (
                <p className="diet-today-logs-empty">No feedings logged today.</p>
              ) : (
                <ul className="diet-log diet-log--baby" aria-label="Baby's feedings today">
                  {todayBabyEntries.map((entry) => (
                    <li key={entry.id} className="diet-log-item">
                      <span className="diet-log-time">
                        {new Date(entry.recorded_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <span className="diet-log-food">{entry.food?.trim() || 'Feeding'}</span>
                      {entry.bottle && (
                        <span className="diet-log-bottle">{entry.bottle}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
