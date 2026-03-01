import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Meal } from '../types/database'
import '../styles/TrackPage.css'

const MEAL_OPTIONS: { value: Meal; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
]

const QUALITY_OPTIONS: { value: 1 | 3 | 5; label: string }[] = [
  { value: 1, label: 'Poor' },
  { value: 3, label: 'Good' },
  { value: 5, label: 'Great' },
]

export default function AddMomMeal(): JSX.Element {
  const navigate = useNavigate()
  const { user, mom } = useAuth()
  const [food, setFood] = useState('')
  const [meal, setMeal] = useState<Meal>('breakfast')
  const [quality, setQuality] = useState<1 | 3 | 5>(3)
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
    setSubmitting(true)
    const { error: insertErr } = await client.from('mother_diet').insert({
      mom_id: momId,
      food: food.trim(),
      meal,
      food_quality: quality,
      date: new Date().toISOString().slice(0, 10),
    })
    if (insertErr) {
      setError(insertErr.message)
      setSubmitting(false)
      return
    }
    navigate('/diet', { replace: true })
  }

  return (
    <>
      <header className="app-header">
        <h1>Diet</h1>
        <p>Add a meal for you</p>
      </header>
      <main className="app-main form-page">
        <h2>Log mom&apos;s meal</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mom-food">Food</label>
            <input
              id="mom-food"
              type="text"
              placeholder="e.g. Oatmeal, eggs"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="mom-meal">Meal</label>
            <select
              id="mom-meal"
              value={meal}
              onChange={(e) => setMeal(e.target.value as Meal)}
            >
              {MEAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="mom-quality">Quality</label>
            <select
              id="mom-quality"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value) as 1 | 3 | 5)}
            >
              {QUALITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save meal'}
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
