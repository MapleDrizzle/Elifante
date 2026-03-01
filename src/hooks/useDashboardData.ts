import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Sleep, MotherDiet, Mood, Development } from '../types/database'
import type { Meal } from '../types/database'

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

const MEAL_ORDER: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other']
/** Only these are shown in the diet chart (no snack/other). */
const MEAL_ORDER_DISPLAY: Meal[] = ['breakfast', 'lunch', 'dinner']

export type DietSegment = {
  name: string
  value: number
  filled: boolean
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
      setData(
        MEAL_ORDER_DISPLAY.map((m) => ({
          name: m.charAt(0).toUpperCase() + m.slice(1),
          value: 0,
          filled: false,
        }))
      )
      setLoading(false)
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    const fetchDiet = async (): Promise<void> => {
      const { data: rows } = await client
        .from('mother_diet')
        .select('meal')
        .eq('mom_id', momId)
        .eq('date', today) as { data: MotherDiet[] | null }

      const counts: Record<string, number> = {}
      MEAL_ORDER.forEach((m) => {
        counts[m] = 0
      })
      ;(rows ?? []).forEach((r) => {
        const meal = (r.meal ?? 'other') as Meal
        if (MEAL_ORDER.includes(meal)) counts[meal] += 1
        else counts.other += 1
      })

      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      setData(
        MEAL_ORDER_DISPLAY.map((meal) => ({
          name: meal.charAt(0).toUpperCase() + meal.slice(1),
          value: total > 0 ? counts[meal] : 0,
          filled: counts[meal] > 0,
        }))
      )
      setLoading(false)
    }

    fetchDiet()
  }, [momId])

  return { data, loading }
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

/** kg to lbs */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

/** cm to inches */
export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10
}

export type DevelopmentLog = {
  id: string
  weightKg: number | null
  heightCm: number | null
  milestone: string | null
  recordedAt: string
  ageMonths: number
  ageDays: number
}

export type ChartDataPoint = {
  ageLabel: string // "0 mo" or "2 mo 15 d"
  ageMonths: number
  weightLbs: number | null
  heightIn: number | null
}

export function useBabyDevelopmentHistory(
  babyId: string | null,
  birthDate: string
): {
  logs: DevelopmentLog[]
  weightChartData: ChartDataPoint[]
  heightChartData: ChartDataPoint[]
  loading: boolean
  refetch: () => void
} {
  const [logs, setLogs] = useState<DevelopmentLog[]>([])
  const [weightChartData, setWeightChartData] = useState<ChartDataPoint[]>([])
  const [heightChartData, setHeightChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDev = useCallback(async (): Promise<void> => {
    const client = supabase
    if (!client || !babyId) {
      setLogs([])
      setLoading(false)
      return
    }

    const { data: rows } = await client
      .from('development')
      .select('id, weight_kg, height_cm, milestone, recorded_at')
      .eq('baby_id', babyId)
      .order('recorded_at', { ascending: true }) as { data: Development[] | null }

    const birth = new Date(birthDate)
    const list = (rows ?? []).map((r) => {
      const rec = new Date(r.recorded_at)
      const ageMs = rec.getTime() - birth.getTime()
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))
      const ageMonths = Math.floor(ageDays / 30.44)
      return {
        id: r.id,
        weightKg: r.weight_kg,
        heightCm: r.height_cm,
        milestone: r.milestone,
        recordedAt: r.recorded_at,
        ageMonths,
        ageDays,
      }
    })

    const chartData: ChartDataPoint[] = list.map((log) => ({
      ageLabel:
        log.ageMonths >= 12
          ? `${Math.floor(log.ageMonths / 12)} y ${log.ageMonths % 12} mo`
          : log.ageDays % 30 >= 7
            ? `${log.ageMonths} mo ${log.ageDays % 30} d`
            : `${log.ageMonths} mo`,
      ageMonths: log.ageMonths + log.ageDays / 30.44,
      weightLbs: log.weightKg != null ? kgToLbs(log.weightKg) : null,
      heightIn: log.heightCm != null ? cmToInches(log.heightCm) : null,
    }))

    setLogs(list)

    setWeightChartData(chartData.filter((d) => d.weightLbs != null))
    setHeightChartData(chartData.filter((d) => d.heightIn != null))
    setLoading(false)
  }, [babyId, birthDate])

  useEffect(() => {
    fetchDev()
  }, [fetchDev])

  return {
    logs,
    weightChartData,
    heightChartData,
    loading,
    refetch: fetchDev,
  }
}

export function useInsertDevelopment(babyId: string | null): {
  insert: (args: {
    weightKg?: number | null
    heightCm?: number | null
    milestone?: string | null
  }) => Promise<void>
  inserting: boolean
  error: string | null
} {
  const [inserting, setInserting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const insert = useCallback(
    async (args: {
      weightKg?: number | null
      heightCm?: number | null
      milestone?: string | null
    }) => {
      if (!babyId || !supabase) return
      setError(null)
      setInserting(true)
      try {
        const { error: e } = await supabase.from('development').insert({
          baby_id: babyId,
          weight_kg: args.weightKg ?? null,
          height_cm: args.heightCm ?? null,
          milestone: args.milestone ?? null,
        })
        if (e) throw e
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to log')
        throw err
      } finally {
        setInserting(false)
      }
    },
    [babyId]
  )

  return { insert, inserting, error }
}

export function useUpdateDevelopment(): {
  update: (
    id: string,
    args: {
      weightKg?: number | null
      heightCm?: number | null
      milestone?: string | null
    }
  ) => Promise<void>
  updating: boolean
  error: string | null
} {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = useCallback(
    async (
      id: string,
      args: {
        weightKg?: number | null
        heightCm?: number | null
        milestone?: string | null
      }
    ) => {
      if (!supabase) return
      setError(null)
      setUpdating(true)
      try {
        const { error: e } = await supabase
          .from('development')
          .update({
            weight_kg: args.weightKg,
            height_cm: args.heightCm,
            milestone: args.milestone ?? null,
          })
          .eq('id', id)
        if (e) throw e
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update')
        throw err
      } finally {
        setUpdating(false)
      }
    },
    []
  )

  return { update, updating, error }
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
