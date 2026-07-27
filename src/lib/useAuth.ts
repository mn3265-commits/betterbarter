import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isBackendConfigured, supabase } from './supabase'

export interface Profile {
  id: string
  name: string
  email: string
  campus_id: string
  building: string | null
  handoffs: number
}

/**
 * Supabase auth session + the signed-in user's profile (which carries their
 * campus). When the backend is not configured, this is inert and the app runs
 * on seed data with the demo Gate.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isBackendConfigured)

  useEffect(() => {
    if (!isBackendConfigured || !supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
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
      .select('id, name, email, campus_id, building, handoffs')
      .eq('id', uid)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setProfile((data as Profile) ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  /** Send a magic link to a school email. Sign-up is gated to enrolled campus
   *  domains by the handle_new_user() trigger. */
  async function signIn(email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut(): Promise<void> {
    await supabase?.auth.signOut()
  }

  return {
    configured: isBackendConfigured,
    session,
    userId: session?.user?.id ?? null,
    profile,
    loading,
    signIn,
    signOut,
  }
}

export type Auth = ReturnType<typeof useAuth>
