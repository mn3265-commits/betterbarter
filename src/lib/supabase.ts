import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The Supabase browser client. The app talks to Supabase directly from the
 * client using the anon key; every read/write is constrained by row-level
 * security (see supabase/migrations/0001_init.sql), so the anon key is safe to
 * ship. Server-only work (the paragraph extraction, the day-7 cron) lives in
 * Edge Functions with the service-role key, never here.
 *
 * Both values come from Vite env vars, set in Vercel (Project → Settings →
 * Environment Variables) and in a local `.env` — see `.env.example`.
 *
 * `supabase` is null when the env vars are absent, which is how the deployed
 * prototype keeps running on seed data with no backend attached. Guard on it:
 *
 *   import { supabase, isBackendConfigured } from './lib/supabase'
 *   if (isBackendConfigured) { const { data } = await supabase!.from('listings')… }
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isBackendConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isBackendConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
