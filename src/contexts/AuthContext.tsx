import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, Mom, Baby } from '../types/database'

type AuthContextValue = {
  userId: string | null
  profile: Profile | null
  mom: Mom | null
  babies: Baby[]
  loading: boolean
  displayName: string
}

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  profile: null,
  mom: null,
  babies: [],
  loading: true,
  displayName: 'User',
})

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mom, setMom] = useState<Mom | null>(null)
  const [babies, setBabies] = useState<Baby[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }

    const getInitial = async (): Promise<void> => {
      const { data: { user } } = await client.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUserId(user.id)

      const { data: profileData } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData ?? null)

      if (!profileData) {
        setLoading(false)
        return
      }

      const { data: momData } = await client
        .from('moms')
        .select('*')
        .eq('profile_id', user.id)
        .single()
      setMom(momData ?? null)

      if (!momData) {
        setLoading(false)
        return
      }

      const { data: babiesData } = await client
        .from('babies')
        .select('*')
        .eq('mom_id', momData.id)
        .order('birth_date', { ascending: false })
      setBabies(babiesData ?? [])
      setLoading(false)
    }

    getInitial()

    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUserId(null)
          setProfile(null)
          setMom(null)
          setBabies([])
          setLoading(false)
          return
        }
        setUserId(session.user.id)
        const { data: profileData } = await client
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(profileData ?? null)
        if (!profileData) {
          setMom(null)
          setBabies([])
          setLoading(false)
          return
        }
        const { data: momData } = await client
          .from('moms')
          .select('*')
          .eq('profile_id', session.user.id)
          .single()
        setMom(momData ?? null)
        if (!momData) {
          setBabies([])
          setLoading(false)
          return
        }
        const { data: babiesData } = await client
          .from('babies')
          .select('*')
          .eq('mom_id', momData.id)
          .order('birth_date', { ascending: false })
        setBabies(babiesData ?? [])
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const displayName = profile?.username?.trim() || 'User'

  return (
    <AuthContext.Provider
      value={{
        userId,
        profile,
        mom,
        babies,
        loading,
        displayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username?: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s)
        setUser(s?.user ?? null)
      })
      .catch((err) => {
        console.error('Auth getSession error:', err)
        setUser(null)
        setSession(null)
      })
      .finally(() => setLoading(false))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env')
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
        setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env')
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      clearError,
    }),
    [user, session, loading, error, signIn, signUp, signOut, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
