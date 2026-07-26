# Backend: Vercel + Supabase

The front end (this repo) deploys to **Vercel** as a static Vite build. The
backend is **Supabase**: the browser talks to it directly with the anon key, and
**row-level security** does the enforcement — every read is scoped to the
viewer's campus, so a query can never cross the campus wall.

```
  Browser (React, on Vercel)
      │  supabase-js  (anon key)
      ▼
  Supabase
   ├─ Postgres + RLS      the campus-isolated board, threads, profiles
   ├─ Auth                verified school email (OTP), .edu-domain gated
   ├─ Realtime            live chat threads
   ├─ Storage             listing photos
   └─ Edge Functions      paragraph extraction, the day-7 cron  (service role)
```

## How the handoff spec maps to Supabase

| Spec requirement | Supabase piece | Status |
| --- | --- | --- |
| Verified school-email accounts, per-term re-check | Auth (email OTP) + `profiles.read_only` / `last_verified_at` | schema ✅ · auth wiring ⏳ |
| Campus isolation (every campus its own board) | RLS via `current_campus()` | ✅ in `0001_init.sql` |
| Board feed, filtered by tab/query, distance sort | `listings` + `listings_board_idx` | schema ✅ · queries ⏳ |
| Threads & messages, realtime | `threads` / `messages` + Realtime | schema ✅ · realtime ⏳ |
| Create-listing with photo upload | Storage bucket + `listings.photo_path` | column ✅ · upload ⏳ |
| Day-7 freshness check → auto-pause at 48h | `day7_prompt_at`/`confirmed_at` + pg_cron Edge Function | columns ✅ · job ⏳ |
| Per-campus meetup spots with use counts | `meetup_spots` | ✅ |
| Saved searches + push | `saved_searches` | schema ✅ · push ⏳ |
| Paragraph → listing | client parser today (`src/lib/parse.ts`); Edge Function later | client ✅ · function ⏳ |
| Handoff-count confirmation loop | `threads.buyer_done`/`seller_done` + `profiles.handoffs` | columns ✅ · trigger ⏳ |

## First-time setup (what you do)

1. **Create a Supabase project** at supabase.com (free tier is fine).
2. **Run the migration.** Either:
   - Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`, or
   - paste `supabase/migrations/0001_init.sql` into the SQL editor and run it.
3. **Seed the pilot campus** (SQL editor):
   ```sql
   with c as (
     insert into campuses (name, slug) values ('Columbia', 'columbia') returning id
   )
   insert into campus_domains (domain, campus_id) select 'columbia.edu', id from c;
   ```
4. **Enable email auth**: Auth → Providers → Email (magic link / OTP is enough).
5. **Create a public-read Storage bucket** named `listing-photos`.
6. **Set env vars** in both places (values from Project Settings → API):
   - local `.env` (copy `.env.example`)
   - Vercel → Project → Settings → Environment Variables
   ```
   VITE_SUPABASE_URL=…
   VITE_SUPABASE_ANON_KEY=…
   ```
7. Redeploy. `isBackendConfigured` in `src/lib/supabase.ts` flips to true.

Until step 6, the app runs on the in-memory seed data exactly as it does now, so
the live prototype never breaks while the backend is being wired.

## Remaining wiring (the ⏳ rows — needs a live project to verify)

The current app keeps all state in `src/lib/useHandoff.ts` over the seed arrays
in `src/data/`. The integration replaces those reads with Supabase queries,
feature-flagged on `isBackendConfigured`:

1. **Auth on the Gate** — `supabase.auth.signInWithOtp({ email })`, gate the
   input to campus domains, handle the read-only state on failed re-verify.
2. **Board** — `select` from `listings` (status = active) with tab/query filters
   and the viewer's building for distance; subscribe for live inserts.
3. **Post** — upload the photo to Storage, run the parse, `insert` the listing.
4. **Claim → Chat** — `insert` a thread (with `hold_expires_at = now() + 3h`),
   seed the two messages, then a Realtime subscription on `messages`.
5. **Day-7 lifecycle** — a scheduled Edge Function stamps `day7_prompt_at`, and
   auto-pauses listings with no response after 48h.
6. **Handoff loop** — when `buyer_done` and `seller_done` are both true, a
   trigger releases the hold and increments both `profiles.handoffs`.

This is deliberately staged so it can be built and verified one screen at a time
once the project exists. Hand me the project URL + anon key (and confirm the
migration ran) and I'll wire it up and test each flow against live data.
