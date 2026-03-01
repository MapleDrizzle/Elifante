import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTodayBabyDietEntries } from '../hooks/useDashboardData'
import { askGemini } from '../lib/gemini'
import CalorieGoalChart from '../components/dashboard/CalorieGoalChart'
import BabyMlGoalChart from '../components/dashboard/BabyMlGoalChart'
import DietTodayList from '../components/dashboard/DietTodayList'
import '../styles/TrackPage.css'

export default function Diet(): JSX.Element {
  const { mom, babies } = useAuth()
  const momId = mom?.id ?? null
  const babyIds = babies.map((b) => b.id)
  const { entries: todayBabyEntries, loading: todayBabyLoading } = useTodayBabyDietEntries(babyIds)
  const [dietPlanPrompt, setDietPlanPrompt] = useState('')
  const [dietPlanResult, setDietPlanResult] = useState<string | null>(null)
  const [dietPlanLoading, setDietPlanLoading] = useState(false)
  const [dietPlanError, setDietPlanError] = useState<string | null>(null)

  const handleGetDietPlan = async () => {
    setDietPlanError(null)
    setDietPlanResult(null)
    const userInput = dietPlanPrompt.trim()
    if (!userInput) {
      setDietPlanError('Please describe your goals or situation first.')
      return
    }
    setDietPlanLoading(true)
    try {
      const systemPrompt = `You are a supportive nutrition assistant for a postpartum / new parent app. The user will describe their diet goals or situation. Give a brief, practical, personalized response: meal ideas, calorie guidance, or tips. Keep it encouraging and concise (a few short paragraphs or bullet points). Do not give medical advice; suggest they speak to a doctor for specific conditions.

User's message: ${userInput}`
      const reply = await askGemini(systemPrompt)
      setDietPlanResult(reply)
    } catch (err) {
      setDietPlanError(err instanceof Error ? err.message : 'Could not get suggestions.')
    } finally {
      setDietPlanLoading(false)
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>Diet</h1>
        <p>Track your nutrition and your baby&apos;s meals</p>
      </header>
      <main className="app-main track-page">
        <div className="track-charts">
          <div className="track-chart-card track-chart-card--diet">
            <h3 className="track-chart-title">Mom – daily calorie goal</h3>
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

        <section className="diet-plan-section" aria-label="Diet plan suggestions">
          <h3 className="diet-plan-title">Get a personalized diet plan</h3>
          <p className="diet-plan-description">
            Tell us a bit about your goals or situation (e.g. breastfeeding, calorie target, dietary restrictions), and we&apos;ll suggest a plan.
          </p>
          <div className="form-group">
            <label htmlFor="diet-plan-prompt" className="sr-only">
              Your goals or situation
            </label>
            <textarea
              id="diet-plan-prompt"
              className="diet-plan-input"
              placeholder="e.g. I'm breastfeeding and want to eat around 2000 cal. I don't eat dairy."
              value={dietPlanPrompt}
              onChange={(e) => setDietPlanPrompt(e.target.value)}
              rows={3}
              disabled={dietPlanLoading}
            />
          </div>
          <button
            type="button"
            className="track-btn diet-plan-btn"
            onClick={handleGetDietPlan}
            disabled={dietPlanLoading}
          >
            {dietPlanLoading ? 'Getting suggestions…' : 'Get diet plan suggestions'}
          </button>
          {dietPlanError && (
            <p className="form-error diet-plan-error">{dietPlanError}</p>
          )}
          {dietPlanResult && (
            <div className="diet-plan-result" role="region" aria-label="Diet plan suggestions">
              <h4 className="diet-plan-result-title">Suggestions for you</h4>
              <div className="diet-plan-result-text">{dietPlanResult}</div>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
