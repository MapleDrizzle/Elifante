import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import '../styles/TrackPage.css'

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AddMomSleep(): JSX.Element {
  const navigate = useNavigate()
  const { user, mom } = useAuth()
  const now = new Date()
  const defaultEnd = new Date(now.getTime() - 30 * 60 * 1000) // 30 min ago
  const [startTime, setStartTime] = useState(toDatetimeLocal(defaultEnd.toISOString()))
  const [endTime, setEndTime] = useState(toDatetimeLocal(now.toISOString()))
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
    const start = new Date(startTime).toISOString()
    const end = new Date(endTime).toISOString()
    if (new Date(start) >= new Date(end)) {
      setError('End time must be after start time.')
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
    const { error: insertErr } = await client.from('sleep').insert({
      mom_id: momId,
      baby_id: null,
      start_time: start,
      end_time: end,
    })
    if (insertErr) {
      setError(insertErr.message)
      setSubmitting(false)
      return
    }
    navigate('/sleep', { replace: true })
  }

  return (
    <>
      <header className="app-header">
        <h1>Sleep</h1>
        <p>Log your sleep</p>
      </header>
      <main className="app-main form-page">
        <h2>Log mom&apos;s sleep</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mom-sleep-start">Start time</label>
            <input
              id="mom-sleep-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="mom-sleep-end">End time</label>
            <input
              id="mom-sleep-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save sleep'}
            </button>
            <Link to="/sleep" className="form-cancel">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </>
  )
}
