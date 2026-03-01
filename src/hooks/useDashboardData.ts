import { useCallback, useEffect, useState } from 'react'
import { getLocalDateFromIso, getTodayLocal } from '../lib/dateUtils'
import { supabase } from '../lib/supabase'
import type { Sleep, MotherDiet, BabyDiet, Mood, Development, ForumPost } from '../types/database'

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

    const today = getTodayLocal()

    const fetchDiet = async (): Promise<void> => {
      const { data: rows } = await client
        .from('mother_diet')
        .select('id, food, food_quality, recorded_at')
        .eq('mom_id', momId)
        .eq('date', today)
        .order('recorded_at', { ascending: true }) as { data: (Pick<MotherDiet, 'id' | 'food' | 'food_quality'> & { recorded_at: string })[] | null }

      const filtered = (rows ?? []).filter((r) => getLocalDateFromIso(r.recorded_at) === today)
      const segments: DietSegment[] = filtered.map((r) => ({
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
    const today = getTodayLocal()
    client
      .from('mother_diet')
      .select('id, mom_id, food, meal, food_quality, calories, recorded_at, date')
      .eq('mom_id', momId)
      .eq('date', today)
      .order('recorded_at', { ascending: false })
      .then(({ data }) => {
        const today = getTodayLocal()
        const list = (data as MotherDiet[]) ?? []
        const filtered = list.filter((e) => getLocalDateFromIso(e.recorded_at) === today)
        setEntries(filtered)
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
    const today = getTodayLocal()
    client
      .from('mother_diet')
      .select('calories, recorded_at')
      .eq('mom_id', momId)
      .eq('date', today)
      .then(({ data }) => {
        const rows = (data ?? []) as { calories?: number | null; recorded_at?: string }[]
        const filtered = rows.filter((r) => r.recorded_at && getLocalDateFromIso(r.recorded_at) === today)
        const total = filtered.reduce(
          (sum, row) => sum + (typeof row.calories === 'number' ? row.calories : 0),
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

const BABY_ML_GOAL_DEFAULT = 750

/** Parse bottle/amount text to mL (e.g. "120 ml", "4 oz" -> 120 or ~118). */
function parseBottleToMl(bottle: string | null): number {
  if (!bottle?.trim()) return 0
  const s = bottle.trim().toLowerCase()
  let total = 0
  const mlMatch = s.match(/(\d+(?:\.\d+)?)\s*ml/g)
  if (mlMatch) {
    mlMatch.forEach((m) => {
      const n = parseFloat(m.replace(/\s*ml/i, ''))
      if (!Number.isNaN(n)) total += n
    })
  }
  const ozMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:fl\.?\s*)?oz/g)
  if (ozMatch) {
    ozMatch.forEach((m) => {
      const n = parseFloat(m.replace(/\s*(?:fl\.?\s*)?oz/i, ''))
      if (!Number.isNaN(n)) total += n * 29.57
    })
  }
  return Math.round(total)
}

/** Today's baby diet entries (all babies) for list display. */
export function useTodayBabyDietEntries(babyIds: string[]): {
  entries: BabyDiet[]
  loading: boolean
} {
  const [entries, setEntries] = useState<BabyDiet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client || babyIds.length === 0) {
      setEntries([])
      setLoading(false)
      return
    }
    const today = getTodayLocal()
    client
      .from('baby_diet')
      .select('id, baby_id, food, bottle, recorded_at, date')
      .in('baby_id', babyIds)
      .eq('date', today)
      .order('recorded_at', { ascending: false })
      .then(({ data }) => {
        const today = getTodayLocal()
        const list = (data as BabyDiet[]) ?? []
        const filtered = list.filter((e) => getLocalDateFromIso(e.recorded_at) === today)
        setEntries(filtered)
        setLoading(false)
      })
  }, [babyIds.join(',')])

  return { entries, loading }
}

/** Today's total mL for baby feedings (parsed from bottle field) and goal. */
export function useTodayBabyDietMl(babyIds: string[]): {
  totalMl: number
  goalMl: number
  loading: boolean
} {
  const [totalMl, setTotalMl] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client || babyIds.length === 0) {
      setTotalMl(0)
      setLoading(false)
      return
    }
    const today = getTodayLocal()
    client
      .from('baby_diet')
      .select('bottle, recorded_at')
      .in('baby_id', babyIds)
      .eq('date', today)
      .then(({ data }) => {
        const rows = (data ?? []) as { bottle: string | null; recorded_at?: string }[]
        const filtered = rows.filter((r) => r.recorded_at && getLocalDateFromIso(r.recorded_at) === today)
        const total = filtered.reduce((sum, r) => sum + parseBottleToMl(r.bottle), 0)
        setTotalMl(total)
        setLoading(false)
      })
  }, [babyIds.join(',')])

  return {
    totalMl,
    goalMl: BABY_ML_GOAL_DEFAULT,
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
  emotion: string | null
  moodContext: string | null
  recordedAt: string | null
  loading: boolean
} {
  const [mood, setMood] = useState<number | null>(null)
  const [emotion, setEmotion] = useState<string | null>(null)
  const [moodContext, setMoodContext] = useState<string | null>(null)
  const [recordedAt, setRecordedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client || !momId) {
      setMood(null)
      setEmotion(null)
      setMoodContext(null)
      setRecordedAt(null)
      setLoading(false)
      return
    }

    const fetchMood = async (): Promise<void> => {
      const { data } = await client
        .from('mood')
        .select('*')
        .eq('mom_id', momId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle() as { data: Mood | null }
      setMood(data?.mood ?? null)
      setEmotion(data?.emotion ?? null)
      setMoodContext(data?.mood_context ?? null)
      setRecordedAt(data?.recorded_at ?? null)
      setLoading(false)
    }

    fetchMood()
  }, [momId])

  return { mood, emotion, moodContext, recordedAt, loading }
}

export function useMoodHistory(momId: string | null): {
  moods: Mood[]
  loading: boolean
  refetch: () => void
} {
  const [moods, setMoods] = useState<Mood[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const client = supabase
    if (!client || !momId) {
      setMoods([])
      setLoading(false)
      return
    }
    const { data } = await client
      .from('mood')
      .select('*')
      .eq('mom_id', momId)
      .order('recorded_at', { ascending: false }) as { data: Mood[] | null }
    setMoods(data ?? [])
    setLoading(false)
  }, [momId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { moods, loading, refetch: fetch }
}

export function useInsertMood(momId: string | null): {
  insert: (mood: number, emotion?: string | null, moodContext?: string | null) => Promise<void>
  inserting: boolean
  error: string | null
} {
  const [inserting, setInserting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const insert = useCallback(
    async (rating: number, emotionText?: string | null, context?: string | null) => {
      if (!momId || !supabase) return
      setError(null)
      setInserting(true)
      try {
        const row: { mom_id: string; mood: number; emotion?: string | null; mood_context?: string | null } = {
          mom_id: momId,
          mood: rating,
        }
        if (emotionText != null && String(emotionText).trim() !== '') row.emotion = emotionText.trim()
        if (context != null && String(context).trim() !== '') row.mood_context = context.trim()
        const { error: e } = await supabase.from('mood').insert(row)
        if (e) {
          if (e.message?.includes('emotion') || e.message?.includes('mood_context') || e.code === '42703') {
            const { error: e2 } = await supabase.from('mood').insert({ mom_id: momId, mood: rating })
            if (e2) throw e2
          } else throw e
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to log mood')
        throw err
      } finally {
        setInserting(false)
      }
    },
    [momId]
  )

  return { insert, inserting, error }
}

export type ForumPostWithProfile = ForumPost & {
  profiles?: { username: string | null } | null
}

export function useForumPosts(): {
  posts: ForumPostWithProfile[]
  loading: boolean
  refetch: () => void
} {
  const [posts, setPosts] = useState<ForumPostWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const client = supabase
    if (!client) {
      setPosts([])
      setLoading(false)
      return
    }
    const { data } = await client
      .from('forum_posts')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false }) as {
      data: ForumPostWithProfile[] | null
    }
    setPosts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { posts, loading, refetch: fetch }
}

export function useInsertForumPost(profileId: string | null): {
  insert: (topic: string, body: string) => Promise<void>
  inserting: boolean
  error: string | null
} {
  const [inserting, setInserting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const insert = useCallback(
    async (topic: string, body: string) => {
      if (!profileId || !supabase) return
      setError(null)
      setInserting(true)
      try {
        const { error: e } = await supabase.from('forum_posts').insert({
          profile_id: profileId,
          topic: topic.trim(),
          body: body.trim(),
        })
        if (e) throw e
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to post')
        throw err
      } finally {
        setInserting(false)
      }
    },
    [profileId]
  )

  return { insert, inserting, error }
}

export function useUpdateForumPost(profileId: string | null): {
  update: (postId: string, topic: string, body: string) => Promise<void>
  updating: boolean
  error: string | null
} {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = useCallback(
    async (postId: string, topic: string, body: string) => {
      if (!profileId || !supabase) return
      setError(null)
      setUpdating(true)
      try {
        const { error: e } = await supabase
          .from('forum_posts')
          .update({ topic: topic.trim(), body: body.trim() })
          .eq('id', postId)
          .eq('profile_id', profileId)
        if (e) throw e
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update post')
        throw err
      } finally {
        setUpdating(false)
      }
    },
    [profileId]
  )

  return { update, updating, error }
}

export function useDeleteForumPost(profileId: string | null): {
  deletePost: (postId: string) => Promise<void>
  deleting: boolean
  error: string | null
} {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deletePost = useCallback(
    async (postId: string) => {
      if (!profileId || !supabase) return
      setError(null)
      setDeleting(true)
      try {
        const { error: e } = await supabase
          .from('forum_posts')
          .delete()
          .eq('id', postId)
          .eq('profile_id', profileId)
        if (e) throw e
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete post')
        throw err
      } finally {
        setDeleting(false)
      }
    },
    [profileId]
  )

  return { deletePost, deleting, error }
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
