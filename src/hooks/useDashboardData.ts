import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Sleep, MotherDiet, Mood, Development } from '../types/database'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export type DaySleep = {
  day: string
  motherHours: number
  babyHours: number
}

export function useWeeklySleep(momId: string | null, babyIds: string[]): {
  data: DaySleep[]
  loading: boolean
} {
  const [data, setData] = useState<DaySleep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client || !momId) {
      setData([])
      setLoading(false)
      return
    }

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const from = weekAgo.toISOString()

    const fetchSleep = async (): Promise<void> => {
      const { data: momSleep } = await client
        .from('sleep')
        .select('start_time, end_time, duration_minutes')
        .eq('mom_id', momId)
        .gte('start_time', from)

      const { data: babySleep } = babyIds.length
        ? await client
            .from('sleep')
            .select('start_time, end_time, duration_minutes')
            .in('baby_id', babyIds)
            .gte('start_time', from)
        : { data: [] as Sleep[] }

      const byDay: Record<string, { mother: number; baby: number }> = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        byDay[key] = { mother: 0, baby: 0 }
      }

      const add = (
        rows: { start_time: string; duration_minutes: number }[] | null,
        key: 'mother' | 'baby'
      ): void => {
        if (!rows) return
        rows.forEach((row) => {
          const date = row.start_time.slice(0, 10)
          if (byDay[date]) byDay[date][key] += row.duration_minutes / 60
        })
      }

      add(momSleep ?? [], 'mother')
      add(babySleep ?? [], 'baby')

      const sorted = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, hrs]) => ({
          day: DAY_LABELS[new Date(date).getDay()],
          motherHours: Math.round(hrs.mother * 10) / 10,
          babyHours: Math.round(hrs.baby * 10) / 10,
        }))
      setData(sorted)
      setLoading(false)
    }

    fetchSleep()
  }, [momId, babyIds.join(',')])

  return { data, loading }
}

/** Today's mother_diet rows for showing logs when clicking a segment. */
export type DietSegment = {
  id: string
  name: string
  value: number
  quality: number
}

export function useTodayDiet(momId: string | null): {
  data: DietSegment[]
  loading: boolean
} {
  const [data, setData] = useState<DietSegment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client || !momId) {
      setData([])
      setLoading(false)
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    const fetchDiet = async (): Promise<void> => {
      const { data: rows } = await client
        .from('mother_diet')
        .select('id, food, food_quality')
        .eq('mom_id', momId)
        .eq('date', today)
        .order('recorded_at', { ascending: true }) as { data: (Pick<MotherDiet, 'id' | 'food' | 'food_quality'>)[] | null }

      const segments: DietSegment[] = (rows ?? []).map((r) => ({
        id: r.id,
        name: r.food?.trim() || 'Meal',
        value: 1,
        quality: Math.max(1, Math.min(5, r.food_quality ?? 3)),
      }))
      setData(segments)
      setLoading(false)
    }

    fetchDiet()
  }, [momId])

  return { data, loading }
}

export function useTodayDietEntries(momId: string | null): {
  entries: MotherDiet[]
  loading: boolean
} {
  const [entries, setEntries] = useState<MotherDiet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client || !momId) {
      setEntries([])
      setLoading(false)
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    client
      .from('mother_diet')
      .select('id, mom_id, food, meal, food_quality, recorded_at, date')
      .eq('mom_id', momId)
      .eq('date', today)
      .order('recorded_at', { ascending: true })
      .then(({ data }) => {
        setEntries((data as MotherDiet[]) ?? [])
        setLoading(false)
      })
  }, [momId])

  return { entries, loading }
}

const CALORIE_GOAL_DEFAULT = 2000

/** Today's total calories for mom (sum of mother_diet.calories for today). */
export function useTodayDietCalories(momId: string | null): {
  totalCalories: number
  goal: number
  loading: boolean
} {
  const [totalCalories, setTotalCalories] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client || !momId) {
      setTotalCalories(0)
      setLoading(false)
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    client
      .from('mother_diet')
      .select('calories')
      .eq('mom_id', momId)
      .eq('date', today)
      .then(({ data }) => {
        const total = (data ?? []).reduce(
          (sum: number, row: { calories?: number | null }) =>
            sum + (typeof row.calories === 'number' ? row.calories : 0),
          0
        )
        setTotalCalories(total)
        setLoading(false)
      })
  }, [momId])

  return {
    totalCalories: Math.round(totalCalories),
    goal: CALORIE_GOAL_DEFAULT,
    loading,
  }
}

export type BabyDayDiet = {
  day: string
  count: number
}

export function useBabyDietWeekly(babyIds: string[]): {
  data: BabyDayDiet[]
  loading: boolean
} {
  const [data, setData] = useState<BabyDayDiet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client || babyIds.length === 0) {
      setData([])
      setLoading(false)
      return
    }

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const from = weekAgo.toISOString().slice(0, 10)

    const fetchDiet = async (): Promise<void> => {
      const { data: rows } = await client
        .from('baby_diet')
        .select('date')
        .in('baby_id', babyIds)
        .gte('date', from)

      const byDay: Record<string, number> = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        byDay[d.toISOString().slice(0, 10)] = 0
      }
      ;(rows ?? []).forEach((r: { date: string }) => {
        const key = r.date?.slice(0, 10)
        if (key && byDay[key] !== undefined) byDay[key] += 1
      })

      const sorted = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({
          day: DAY_LABELS[new Date(date).getDay()],
          count,
        }))
      setData(sorted)
      setLoading(false)
    }

    fetchDiet()
  }, [babyIds.join(',')])

  return { data, loading }
}

export function useLatestMood(momId: string | null): {
  mood: number | null
  loading: boolean
} {
  const [mood, setMood] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client || !momId) {
      setMood(null)
      setLoading(false)
      return
    }

    const fetchMood = async (): Promise<void> => {
      const { data } = await client
        .from('mood')
        .select('mood')
        .eq('mom_id', momId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single() as { data: Mood | null }
      setMood(data?.mood ?? null)
      setLoading(false)
    }

    fetchMood()
  }, [momId])

  return { mood, loading }
}

export type BabyDevelopmentInfo = {
  weightKg: number | null
  heightCm: number | null
  ageMonths: number
  babyName: string
  birthDate: string
  milestones: string[]
}

export function useBabyDevelopment(
  babyId: string | null,
  babyName: string,
  birthDate: string
): {
  data: BabyDevelopmentInfo | null
  loading: boolean
} {
  const [data, setData] = useState<BabyDevelopmentInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client || !babyId) {
      setData({
        weightKg: null,
        heightCm: null,
        ageMonths: 0,
        babyName,
        birthDate,
        milestones: [],
      })
      setLoading(false)
      return
    }

    const fetchDev = async (): Promise<void> => {
      const { data: rows } = await client
        .from('development')
        .select('weight_kg, height_cm, milestone, recorded_at')
        .eq('baby_id', babyId)
        .order('recorded_at', { ascending: false })
        .limit(20) as { data: Development[] | null }

      const list = rows ?? []
      const latest = list[0] ?? null
      const ageMonths = (() => {
        const birth = new Date(birthDate)
        const now = new Date()
        return Math.max(
          0,
          (now.getFullYear() - birth.getFullYear()) * 12 +
            (now.getMonth() - birth.getMonth())
        )
      })()

      const milestones = list
        .filter((r) => r.milestone?.trim())
        .map((r) => r.milestone!.trim())
        .slice(0, 5)

      setData({
        weightKg: latest?.weight_kg ?? null,
        heightCm: latest?.height_cm ?? null,
        ageMonths,
        babyName,
        birthDate,
        milestones,
      })
      setLoading(false)
    }

    fetchDev()
  }, [babyId, babyName, birthDate])

  return { data, loading }
}
