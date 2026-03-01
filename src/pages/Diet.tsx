import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTodayDiet, useBabyDietWeekly } from '../hooks/useDashboardData'
import { supabase } from '../lib/supabase'
import type { MotherDiet, BabyDiet } from '../types/database'
import DietChart from '../components/dashboard/DietChart'
import BabyDietChart from '../components/dashboard/BabyDietChart'
import '../styles/TrackPage.css'

const DIET_CHART_HEIGHT = 300
const DIET_PIE_INNER = 70
const DIET_PIE_OUTER = 115

export default function Diet(): JSX.Element {
  const { mom, babies } = useAuth()
  const momId = mom?.id ?? null
  const babyIds = babies.map((b) => b.id)
  const { data: dietData, loading: dietLoading } = useTodayDiet(momId)
  const { data: babyDietData, loading: babyDietLoading } = useBabyDietWeekly(babyIds)
  const [lastMomMeal, setLastMomMeal] = useState<MotherDiet | null>(null)
  const [lastBabyMeal, setLastBabyMeal] = useState<BabyDiet | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client || !momId) {
      setLastMomMeal(null)
      return
    }
    client
      .from('mother_diet')
      .select('*')
      .eq('mom_id', momId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setLastMomMeal(data ?? null))
  }, [momId])

  useEffect(() => {
    const client = supabase
    const babyIds = babies.map((b) => b.id)
    if (!client || babyIds.length === 0) {
      setLastBabyMeal(null)
      return
    }
    client
      .from('baby_diet')
      .select('*')
      .in('baby_id', babyIds)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLastBabyMeal(data ?? null))
  }, [babies])

  const formatMeal = (row: MotherDiet | null): string => {
    if (!row) return '—'
    const parts = [row.food]
    if (row.meal) parts.push(row.meal)
    const q = row.food_quality
    if (q != null) {
      if (q <= 2) parts.push('Poor')
      else if (q <= 4) parts.push('Good')
      else parts.push('Great')
    }
    const d = new Date(row.recorded_at)
    parts.push(d.toLocaleDateString())
    return parts.join(' · ')
  }

  const formatBabyMeal = (row: BabyDiet | null): string => {
    if (!row) return '—'
    const parts = [row.food || 'Meal', row.bottle || ''].filter(Boolean)
    const d = new Date(row.recorded_at)
    parts.push(d.toLocaleDateString())
    return parts.length ? parts.join(' · ') : '—'
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
            <h3 className="track-chart-title">Mom – today</h3>
            <DietChart
              data={dietData}
              loading={dietLoading}
              height={DIET_CHART_HEIGHT}
              innerRadius={DIET_PIE_INNER}
              outerRadius={DIET_PIE_OUTER}
            />
          </div>
          <div className="track-chart-card track-chart-card--diet">
            <h3 className="track-chart-title">Baby – this week</h3>
            {babies.length === 0 ? (
              <div className="track-chart-placeholder">
                Add a baby to track
              </div>
            ) : (
              <BabyDietChart
                data={babyDietData}
                loading={babyDietLoading}
                height={DIET_CHART_HEIGHT}
              />
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

        <section className="track-last-logged" aria-label="Last logged meals">
          <div>
            <p className="track-last-label">Last mom meal</p>
            <p className={`track-last-value ${!lastMomMeal ? 'track-last-empty' : ''}`}>
              {formatMeal(lastMomMeal)}
            </p>
          </div>
          <div>
            <p className="track-last-label">Last baby meal</p>
            <p className={`track-last-value ${!lastBabyMeal ? 'track-last-empty' : ''}`}>
              {formatBabyMeal(lastBabyMeal)}
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
