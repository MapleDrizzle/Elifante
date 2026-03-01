import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import '../styles/TrackPage.css'

export default function AddBabyMeal(): JSX.Element {
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
      setError('App not configured.')
      return
    }
    if (!babyId) {
      setError('Please select a baby.')
      return
    }
    setSubmitting(true)
    const today = new Date().toISOString().slice(0, 10)
    const { error: insertErr } = await client.from('baby_diet').insert({
      baby_id: babyId,
      food: food.trim() || null,
      bottle: bottle.trim() || null,
      date: today,
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
          <h1>Diet</h1>
          <p>Add a meal for baby</p>
        </header>
        <main className="app-main form-page">
          <p className="track-last-empty">
            Add a baby in Baby Development first, then you can log their meals here.
          </p>
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <Link to="/diet" className="form-cancel">
              Back to Diet
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <header className="app-header">
        <h1>Diet</h1>
        <p>Add a meal for baby</p>
      </header>
      <main className="app-main form-page">
        <h2>Log baby&apos;s meal</h2>
        <form onSubmit={handleSubmit}>
          {babies.length > 1 && (
            <div className="form-group">
              <label htmlFor="baby-select">Baby</label>
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
            <label htmlFor="baby-food">Type of food / feeding</label>
            <input
              id="baby-food"
              type="text"
              placeholder="e.g. Formula, Breast milk, Puree"
              value={food}
              onChange={(e) => setFood(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="baby-bottle">Amount / notes</label>
            <input
              id="baby-bottle"
              type="text"
              placeholder="e.g. 120 ml, 10 min, 4 oz"
              value={bottle}
              onChange={(e) => setBottle(e.target.value)}
            />
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
