import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getTodayLocal } from '../lib/dateUtils'
import { supabase } from '../lib/supabase'
import '../styles/TrackPage.css'

export default function AddBabyMeal(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { babies } = useAuth()
  const [babyId, setBabyId] = useState(babies[0]?.id ?? '')
  const [food, setFood] = useState('')
  const [bottle, setBottle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (babies.length > 0 && !babies.some((b) => b.id === babyId)) {
      setBabyId(babies[0].id)
    }
  }, [babies, babyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const client = supabase
    if (!client) {
      setError(t('errors.appNotConfigured'))
      return
    }
    if (!babyId) {
      setError(t('errors.selectBaby'))
      return
    }
    setSubmitting(true)
    const { error: insertErr } = await client.from('baby_diet').insert({
      baby_id: babyId,
      food: food.trim() || null,
      bottle: bottle.trim() || null,
      date: getTodayLocal(),
    })
    if (insertErr) {
      setError(insertErr.message)
      setSubmitting(false)
      return
    }
    navigate('/diet', { replace: true })
  }

  if (babies.length === 0) {
    return (
      <>
        <header className="app-header">
          <h1>{t('diet.title')}</h1>
          <p>{t('diet.addMealForBaby')}</p>
        </header>
        <main className="app-main form-page">
          <p className="track-last-empty">
            {t('diet.addBabyFirst')}
          </p>
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <Link to="/diet" className="form-cancel">
              {t('diet.backToDiet')}
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <header className="app-header">
        <h1>{t('diet.title')}</h1>
        <p>{t('diet.addMealForBaby')}</p>
      </header>
      <main className="app-main form-page">
        <h2>{t('diet.logBabysMeal')}</h2>
        <form onSubmit={handleSubmit}>
          {babies.length > 1 && (
            <div className="form-group">
              <label htmlFor="baby-select">{t('diet.baby')}</label>
              <select
                id="baby-select"
                value={babyId}
                onChange={(e) => setBabyId(e.target.value)}
              >
                {babies.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="baby-food">{t('diet.foodTypeLabel')}</label>
            <input
              id="baby-food"
              type="text"
              placeholder={t('diet.foodTypePlaceholder')}
              value={food}
              onChange={(e) => setFood(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="baby-bottle">{t('diet.amountLabel')}</label>
            <input
              id="baby-bottle"
              type="text"
              placeholder={t('diet.amountPlaceholder')}
              value={bottle}
              onChange={(e) => setBottle(e.target.value)}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={submitting}>
              {submitting ? t('diet.saving') : t('diet.saveMeal')}
            </button>
            <Link to="/diet" className="form-cancel">
              {t('common.cancel')}
            </Link>
          </div>
        </form>
      </main>
    </>
  )
}
