import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import '../styles/TrackPage.css'

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AddBabySleep(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { babies } = useAuth()
  const now = new Date()
  const defaultEnd = new Date(now.getTime() - 30 * 60 * 1000)
  const [babyId, setBabyId] = useState(babies[0]?.id ?? '')
  const [startTime, setStartTime] = useState(toDatetimeLocal(defaultEnd.toISOString()))
  const [endTime, setEndTime] = useState(toDatetimeLocal(now.toISOString()))
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
      setError('Please select a baby.')
      return
    }
    const start = new Date(startTime).toISOString()
    const end = new Date(endTime).toISOString()
    if (new Date(start) >= new Date(end)) {
      setError(t('errors.endAfterStart'))
      return
    }
    setSubmitting(true)
    const { error: insertErr } = await client.from('sleep').insert({
      mom_id: null,
      baby_id: babyId,
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

  if (babies.length === 0) {
    return (
      <>
        <header className="app-header">
          <h1>{t('sleep.title')}</h1>
          <p>{t('sleep.addSleepForBaby')}</p>
        </header>
        <main className="app-main form-page">
          <p className="track-last-empty">
            {t('sleep.addBabyFirst')}
          </p>
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <Link to="/sleep" className="form-cancel">
              {t('sleep.backToSleep')}
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <header className="app-header">
        <h1>{t('sleep.title')}</h1>
        <p>{t('sleep.addSleepForBaby')}</p>
      </header>
      <main className="app-main form-page">
        <h2>{t('sleep.logBabysSleep')}</h2>
        <form onSubmit={handleSubmit}>
          {babies.length > 1 && (
            <div className="form-group">
              <label htmlFor="baby-sleep-select">{t('diet.baby')}</label>
              <select
                id="baby-sleep-select"
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
            <label htmlFor="baby-sleep-start">{t('sleep.startTime')}</label>
            <input
              id="baby-sleep-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="baby-sleep-end">{t('sleep.endTime')}</label>
            <input
              id="baby-sleep-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={submitting}>
              {submitting ? t('diet.saving') : t('sleep.saveSleep')}
            </button>
            <Link to="/sleep" className="form-cancel">
              {t('common.cancel')}
            </Link>
          </div>
        </form>
      </main>
    </>
  )
}
