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
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
