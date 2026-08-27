import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isBackendConfigured, supabase } from './supabase'

export interface Profile {
  id: string
  name: string
  email: string
  campus_id: string
  building: string | null
  preferred_spot: string | null
  approx_lat: number | null
  approx_lng: number | null
  handoffs: number
  no_shows: number
  read_only: boolean
  joined_at: string | null
}

const PROFILE_COLS =
  'id, name, email, campus_id, building, preferred_spot, approx_lat, approx_lng, handoffs, no_shows, read_only, joined_at'

/**
 * Supabase auth session + the signed-in user's profile (which carries their
 * campus). When the backend is not configured this is inert and the app runs
 * on seed data.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isBackendConfigured)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!isBackendConfigured || !supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!isBackendConfigured || !supabase) return
    const uid = session?.user?.id
    if (!uid) {
      setProfile(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select(PROFILE_COLS)
      .eq('id', uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setProfileError(error.message)
        setProfile((data as Profile) ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session, nonce])

  const refreshProfile = useCallback(() => setNonce((n) => n + 1), [])

  /** Magic link to a school email. Sign-up is gated to enrolled campus domains
   *  by the handle_new_user() trigger. */
  async function signIn(email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/app' },
    })
    if (error) throw error
  }

  /** One-tap sign-in with a campus Google (LionMail) account. */
  async function signInWithGoogle(): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/app',
        queryParams: { hd: 'columbia.edu', prompt: 'select_account' },
      },
    })
    if (error) throw error
  }

  async function signOut(): Promise<void> {
    await supabase?.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  return {
    configured: isBackendConfigured,
    session,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    profile,
    profileError,
    loading,
    refreshProfile,
    signIn,
    signInWithGoogle,
    signOut,
  }
}

export type Auth = ReturnType<typeof useAuth>
