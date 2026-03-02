import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useTodayBabyDietEntries } from '../hooks/useDashboardData'
import CalorieGoalChart from '../components/dashboard/CalorieGoalChart'
import BabyMlGoalChart from '../components/dashboard/BabyMlGoalChart'
import DietTodayList from '../components/dashboard/DietTodayList'
import { askGemini } from '../lib/gemini'
import '../styles/TrackPage.css'

export default function Diet(): JSX.Element {
  const { t } = useTranslation()
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
      setDietPlanError(t('errors.describeGoals'))
      return
    }
    setDietPlanLoading(true)
    try {
      const systemPrompt = `You are a supportive nutrition assistant for a postpartum / new parent app. The user will describe their diet goals or situation. Give a brief, practical, personalized response: meal ideas, calorie guidance, or tips. Keep it encouraging and concise (a few short paragraphs or bullet points). Do not give medical advice; suggest they speak to a doctor for specific conditions.

User's message: ${userInput}`
      const reply = await askGemini(systemPrompt)
      setDietPlanResult(reply)
    } catch (err) {
      setDietPlanError(err instanceof Error ? err.message : t('errors.couldNotGetSuggestions'))
    } finally {
      setDietPlanLoading(false)
    }
  }


  return (
    <>
      <header className="app-header">
        <h1>{t('diet.title')}</h1>
        <p>{t('diet.subtitle')}</p>
      </header>
      <main className="app-main track-page">
        <div className="track-charts">
          <div className="track-chart-card track-chart-card--diet">
            <h3 className="track-chart-title">{t('diet.momCalorieGoal')}</h3>
            <CalorieGoalChart momId={momId} />
          </div>
          <div className="track-chart-card track-chart-card--diet">
            <h3 className="track-chart-title">{t('diet.babyIntake')}</h3>
            {babies.length === 0 ? (
              <div className="track-chart-placeholder">
                {t('home.addBabyToTrack')}
              </div>
            ) : (
              <BabyMlGoalChart babyIds={babyIds} />
            )}
          </div>
        </div>

        <div className="track-buttons">
          <Link to="/diet/add-mom" className="track-btn">
            {t('diet.addMealMom')}
          </Link>
          <Link to="/diet/add-baby" className="track-btn">
            {t('diet.addMealBaby')}
          </Link>
        </div>

        <section className="diet-today-logs" aria-label="Today's diet logs">
          <h3 className="diet-today-logs-title">{t('diet.todaysLogs')}</h3>
          <div className="diet-today-logs-grid">
            <div className="diet-today-logs-col">
              <h4 className="diet-today-logs-col-title">{t('diet.mom')}</h4>
              <DietTodayList momId={momId} />
            </div>
            <div className="diet-today-logs-col">
              <h4 className="diet-today-logs-col-title">{t('diet.baby')}</h4>
              {todayBabyLoading ? (
                <p className="diet-today-logs-loading">{t('common.loading')}</p>
              ) : todayBabyEntries.length === 0 ? (
                <p className="diet-today-logs-empty">{t('diet.noFeedingsToday')}</p>
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
          <h3 className="diet-plan-title">{t('diet.getDietPlan')}</h3>
          <p className="diet-plan-description">
            {t('diet.dietPlanDescription')}
          </p>
          <div className="form-group">
            <label htmlFor="diet-plan-prompt" className="sr-only">
              Your goals or situation
            </label>
            <textarea
              id="diet-plan-prompt"
              className="diet-plan-input"
              placeholder={t('diet.goalsPlaceholder')}
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
              <h4 className="diet-plan-result-title">{t('diet.suggestionsForYou')}</h4>
              <div className="diet-plan-result-text">{dietPlanResult}</div>
            </div>
          )}
        </section>

      </main>
    </>
  )
}
