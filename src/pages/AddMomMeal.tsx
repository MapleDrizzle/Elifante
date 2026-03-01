import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getTodayLocal } from '../lib/dateUtils'
import { supabase } from '../lib/supabase'
import { estimateCalories } from '../lib/gemini'
import '../styles/TrackPage.css'

export default function AddMomMeal(): JSX.Element {
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
      setError('Not signed in.')
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
      setError('Please describe what you ate.')
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
      setError(err instanceof Error ? err.message : 'Could not estimate calories.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>Diet</h1>
        <p>Add a meal for you</p>
      </header>
      <main className="app-main form-page">
        <h2>What did you eat?</h2>
        <p className="form-hint">Describe your meal and we&apos;ll estimate the calories for your daily goal.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mom-what-ate" className="sr-only">
              What did you eat?
            </label>
            <input
              id="mom-what-ate"
              type="text"
              placeholder="e.g. Two eggs, toast with butter, orange juice"
              value={whatAte}
              onChange={(e) => setWhatAte(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={submitting}>
              {submitting ? 'Estimating & saving…' : 'Add to daily goal'}
            </button>
            <Link to="/diet" className="form-cancel">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </>
  )
}
