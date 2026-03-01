import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, Mom, Baby } from '../types/database'

type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: Profile | null
  mom: Mom | null
  babies: Baby[]
  loading: boolean
  error: string | null
  displayName: string
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username?: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  addBaby: (name: string, birthDate: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function loadProfileData(
  userId: string,
  setProfile: (p: Profile | null) => void,
  setMom: (m: Mom | null) => void,
  setBabies: (b: Baby[]) => void
): Promise<void> {
  const client = supabase
  if (!client) return

  const { data: profileData } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  setProfile(profileData ?? null)
  if (!profileData) {
    setMom(null)
    setBabies([])
    return
  }

  const { data: momData } = await client
    .from('moms')
    .select('*')
    .eq('profile_id', userId)
    .single()
  setMom(momData ?? null)
  if (!momData) {
    setBabies([])
    return
  }

  const { data: babiesData } = await client
    .from('babies')
    .select('*')
    .eq('mom_id', momData.id)
    .order('birth_date', { ascending: false })
  setBabies(babiesData ?? [])
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mom, setMom] = useState<Mom | null>(null)
  const [babies, setBabies] = useState<Baby[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Use only onAuthStateChange to avoid racing getSession() with the listener
    // (both touch storage and can cause "Lock broken" AbortError)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
      if (s?.user) {
        loadProfileData(s.user.id, setProfile, setMom, setBabies)
      } else {
        setProfile(null)
        setMom(null)
        setBabies([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    if (!supabase) {
      setError(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env'
      )
      throw new Error('Supabase not configured')
    }
    const { error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e) {
      setError(e.message)
      throw e
    }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, username?: string) => {
      setError(null)
      if (!supabase) {
        setError(
          'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env'
        )
        throw new Error('Supabase not configured')
      }
      const { error: e } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: username ? { username, full_name: username } : undefined,
        },
      })
      if (e) {
        setError(e.message)
        throw e
      }
    },
    []
  )

  const signOut = useCallback(async () => {
    setError(null)
    if (supabase) await supabase.auth.signOut()
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const addBaby = useCallback(
    async (name: string, birthDate: string) => {
      setError(null)
      if (!supabase || !user) {
        setError('You must be signed in to add a baby.')
        throw new Error('Not signed in')
      }
      const client = supabase

      let momId = mom?.id
      if (!momId) {
        const { data: newMom, error: momErr } = await client
          .from('moms')
          .insert({ profile_id: user.id })
          .select('id')
          .single()
        if (momErr) {
          setError(momErr.message)
          throw momErr
        }
        momId = newMom?.id
      }
      if (!momId) {
        setError('Could not create or find mom record.')
        throw new Error('No mom id')
      }

      const { error: babyErr } = await client.from('babies').insert({
        mom_id: momId,
        name: name.trim(),
        birth_date: birthDate,
      })
      if (babyErr) {
        setError(babyErr.message)
        throw babyErr
      }

      await loadProfileData(user.id, setProfile, setMom, setBabies)
    },
    [user, mom?.id]
  )

  const displayName = profile?.username?.trim() || 'User'

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      mom,
      babies,
      loading,
      error,
      displayName,
      signIn,
      signUp,
      signOut,
      clearError,
      addBaby,
    }),
    [
      user,
      session,
      profile,
      mom,
      babies,
      loading,
      error,
      displayName,
      signIn,
      signUp,
      signOut,
      clearError,
      addBaby,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
