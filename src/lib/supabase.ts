import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The Supabase browser client. The app talks to Supabase directly with the
 * publishable ("anon") key; every read/write is constrained by row-level
 * security (see supabase/migrations/*.sql), so this key is safe to ship in the
 * bundle — that is what it is for. Server-only work (the day-7 cron, any
 * service-role task) belongs in Edge Functions, never here.
 *
 * Values come from Vite env vars when present (set them in Vercel or a local
 * `.env` — see `.env.example`) and fall back to the pilot project's public
 * config so the deployed build is self-contained.
 */
const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://gkqyaynukcrrewspekmf.supabase.co'

const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrcXlheW51a2NycmV3c3Bla21mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjYzMjgsImV4cCI6MjEwMDc0MjMyOH0.PTGjucTIV-0ndbU6JfLc9feW5Iq7qyQhKIp8OhaI43M'

export const isBackendConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isBackendConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
