import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useWeeklySleep } from '../hooks/useDashboardData'
import SleepChart from '../components/dashboard/SleepChart'
import { supabase } from '../lib/supabase'
import type { Sleep as SleepRow } from '../types/database'
import '../styles/TrackPage.css'

const SLEEP_CHART_HEIGHT = 360

export default function Sleep(): JSX.Element {
  const { mom, babies } = useAuth()
  const momId = mom?.id ?? null
  const babyIds = babies.map((b) => b.id)
  const { data: sleepData, loading: sleepLoading } = useWeeklySleep(momId, babyIds)
  const [lastMomSleep, setLastMomSleep] = useState<SleepRow | null>(null)
  const [lastBabySleep, setLastBabySleep] = useState<SleepRow | null>(null)

  useEffect(() => {
    const client = supabase
    const momId = mom?.id ?? null
    if (!client || !momId) {
      setLastMomSleep(null)
      return
    }
    client
      .from('sleep')
      .select('*')
      .eq('mom_id', momId)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLastMomSleep(data ?? null))
  }, [mom?.id])

  useEffect(() => {
    const client = supabase
    const babyIds = babies.map((b) => b.id)
    if (!client || babyIds.length === 0) {
      setLastBabySleep(null)
      return
    }
    client
      .from('sleep')
      .select('*')
      .in('baby_id', babyIds)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLastBabySleep(data ?? null))
  }, [babies])

  const formatSleep = (row: SleepRow | null): string => {
    if (!row) return '—'
    const start = new Date(row.start_time)
    const end = new Date(row.end_time)
    const mins = row.duration_minutes ?? 0
    const hrs = Math.floor(mins / 60)
    const m = mins % 60
    const duration = m > 0 ? `${hrs}h ${m}m` : `${hrs}h`
    return `${start.toLocaleDateString()} · ${duration}`
  }

  return (
    <>
      <header className="app-header">
        <h1>Sleep</h1>
        <p>Track your sleep and your baby&apos;s sleep</p>
      </header>
      <main className="app-main track-page">
        <div className="track-charts">
          <div className="track-chart-card track-chart-card--sleep">
            <h3 className="track-chart-title">Mom – sleep</h3>
            <SleepChart
              data={sleepData}
              loading={sleepLoading}
              series="mom"
              height={SLEEP_CHART_HEIGHT}
            />
          </div>
          <div className="track-chart-card track-chart-card--sleep">
            <h3 className="track-chart-title">Baby – sleep</h3>
            {babies.length === 0 ? (
              <div className="track-chart-placeholder">
                Add a baby to track
              </div>
            ) : (
              <SleepChart
                data={sleepData}
                loading={sleepLoading}
                series="baby"
                height={SLEEP_CHART_HEIGHT}
              />
            )}
          </div>
        </div>

        <div className="track-buttons">
          <Link to="/sleep/add-mom" className="track-btn">
            Add sleep (mom)
          </Link>
          <Link to="/sleep/add-baby" className="track-btn">
            Add sleep (baby)
          </Link>
        </div>

        <section className="track-last-logged" aria-label="Last logged sleep">
          <div>
            <p className="track-last-label">Last mom sleep</p>
            <p className={`track-last-value ${!lastMomSleep ? 'track-last-empty' : ''}`}>
              {formatSleep(lastMomSleep)}
            </p>
          </div>
          <div>
            <p className="track-last-label">Last baby sleep</p>
            <p className={`track-last-value ${!lastBabySleep ? 'track-last-empty' : ''}`}>
              {formatSleep(lastBabySleep)}
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
