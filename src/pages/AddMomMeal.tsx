import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getTodayLocal } from '../lib/dateUtils'
import { supabase } from '../lib/supabase'
import { estimateCalories } from '../lib/gemini'
import '../styles/TrackPage.css'

export default function AddMomMeal(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, mom } = useAuth()
  const [whatAte, setWhatAte] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const client = supabase
    if (!client || !user) {
      setError(t('errors.notSignedIn'))
      return
    }
    let momId = mom?.id
    if (!momId) {
      const { data: newMom, error: momErr } = await client
        .from('moms')
        .insert({ profile_id: user.id })
        .select('id')
        .single()
      if (momErr || !newMom) {
        setError(momErr?.message ?? 'Could not create profile.')
        return
      }
      momId = newMom.id
    }
    const description = whatAte.trim()
    if (!description) {
      setError(t('errors.describeWhatAte'))
      return
    }
    setSubmitting(true)
    try {
      const calories = await estimateCalories(description)
      const { error: insertErr } = await client.from('mother_diet').insert({
        mom_id: momId,
        food: description,
        meal: null,
        food_quality: null,
        calories,
        date: getTodayLocal(),
      })
      if (insertErr) {
        setError(insertErr.message)
        setSubmitting(false)
        return
      }
      navigate('/diet', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.couldNotEstimate'))
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>{t('diet.title')}</h1>
        <p>{t('diet.addMealForYou')}</p>
      </header>
      <main className="app-main form-page">
        <h2>{t('diet.whatDidYouEat')}</h2>
        <p className="form-hint">{t('diet.describeMeal')}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mom-what-ate" className="sr-only">
              {t('diet.whatDidYouEat')}
            </label>
            <input
              id="mom-what-ate"
              type="text"
              placeholder={t('diet.mealPlaceholder')}
              value={whatAte}
              onChange={(e) => setWhatAte(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={submitting}>
              {submitting ? t('diet.estimatingSaving') : t('diet.addToDailyGoal')}
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
