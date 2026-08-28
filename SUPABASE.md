# Backend: Vercel + Supabase

The front end deploys to **Vercel** from this repo (push to
`claude/new-commits-qxnib0` → production build). The backend is **Supabase**:
the browser talks to it directly with the publishable anon key, and
**row-level security** does the enforcement — every read is scoped to the
viewer's campus, so a query can never cross the campus wall.

```
  Browser (React, on Vercel)
      │  supabase-js  (publishable anon key)
      ▼
  Supabase
   ├─ Postgres + RLS      campus-isolated board, threads, profiles
   ├─ Auth                Google (LionMail) + school-email magic link
   ├─ Realtime            live board + live chat
   ├─ Storage             listing photos (bucket: listing-photos)
   └─ pg_cron             the day-7 freshness check
```

Project: `gkqyaynukcrrewspekmf` · campus seeded: **Columbia** (`columbia.edu`).

## What is live

| Capability | Status |
| --- | --- |
| Google sign-in (LionMail), magic-link fallback | ✅ |
| Campus isolation via RLS | ✅ |
| Real profile: name, school email, joined, handoff count, hall | ✅ |
| Board reads live listings + realtime updates | ✅ |
| Empty states for a campus with nothing posted yet | ✅ |
| Post: camera → Storage upload → listing insert | ✅ (needs the bucket, below) |
| Claim → thread + 3-hour hold + opening message | ✅ |
| Chat: real messages, realtime | ✅ |
| Wanted posts: read, offer, create | ✅ |
| Day-7 lifecycle buttons (still here / free / gone / relist) | ✅ |
| Day-7 auto-pause on no answer | ⏳ needs pg_cron (below) |
| Saved-search push notifications | ⏳ not built |
| Handoff-count confirmation loop | ✅ (needs migration 0005) |

## Setup still to do in the dashboard

Two things the app cannot do for itself:

**1. Photo storage.** Supabase → **Storage** → **New bucket** → name it exactly
`listing-photos`, tick **Public bucket**, create. Until this exists, posting
still works but silently drops the photo (by design — a missing bucket must
never block a post).

**2. Day-7 auto-pause.** Supabase → **Database** → **Extensions** → enable
**pg_cron**, then run `supabase/migrations/0003_day7_check.sql` in the SQL
editor. The lifecycle *buttons* already work without this; the cron is what
pauses a listing whose owner never answers.

## Migrations

Run in order, in the SQL editor or via `supabase db push`:

- `0001_init.sql` — schema + campus-isolation RLS. **Applied.**
- `0002_harden_rls.sql` — RLS on the lookup tables, helper functions off the
  public RPC surface. **Applied.**
- `0003_day7_check.sql` — the day-7 job. *Pending (needs pg_cron).*
- `0004_rules_agreement.sql` — the community-rules record. **Applied.**
- `0005_handoff_confirm.sql` — `threads.completed_at` + `set_handoff_done()`.

Seeded once, after 0001:

```sql
with c as (
  insert into campuses (name, slug) values ('Columbia', 'columbia') returning id
)
insert into campus_domains (domain, campus_id) select 'columbia.edu', id from c;
```

Adding another school is that same insert with a new name/slug/domain — the
app needs no code change, and the two campuses cannot see each other.

## Auth

- **Google**: Supabase → Authentication → Providers → Google, with an OAuth
  client whose redirect URI is
  `https://gkqyaynukcrrewspekmf.supabase.co/auth/v1/callback`. The app passes
  `hd=columbia.edu` to steer Google at the campus workspace.
- **Site URL**: Authentication → URL Configuration → `https://handoff-bay-two.vercel.app`,
  with `https://handoff-bay-two.vercel.app/**` in Redirect URLs. Both sign-in
  methods now ask to come back to **`/app`**, since `/` is the public site; a
  token that still lands on `/` is forwarded to `/app` with its hash intact.
- The client uses the **implicit** flow so a magic link still completes when the
  email opens it in a different browser than the one that asked for it.
- Sign-up is gated server-side: `handle_new_user()` maps the email domain to a
  campus and rejects anything not enrolled. The app shows that person a clear
  "not a campus we run yet" screen.

While the Google OAuth consent screen is in **Testing**, only accounts added as
test users can sign in, and they see an "unverified app" interstitial. Publish
the consent screen when you want the whole campus to be able to log in.

## The handoff confirmation loop

Live as of migration `0005`. Both people tap "handed off" in the thread;
`set_handoff_done(thread, done)` records that side, and the second tap completes
it: `threads.completed_at` is stamped, the hold is cleared, the listing goes
`gone`, a line lands in the conversation, and **both** `profiles.handoffs` go up
by one. It is SECURITY DEFINER because no client may write the other person's
profile, and it takes `for update` on the thread so two simultaneous taps still
count exactly once. `completed_at` makes it idempotent for good.

## The next real piece of work

**Saved-search notifications** — the saved_searches table exists and the Me
screen already toggles alerts, but nothing yet watches new listings and tells
the people waiting for them. After that: the day-7 cron (above) and no-show
reporting, which is the only other input to reputation.

## Security posture (audited 28 August 2026)

Fixed in this pass, all verified against the live project:

- **Every RPC was callable anonymously.** `revoke ... from public` does not remove
  anonymous access on Supabase, because `anon` and `authenticated` are granted
  EXECUTE directly. Each function did check `auth.uid()` and refuse a stranger,
  so nothing leaked — but the only thing between an anonymous caller and
  cross-campus aggregates was one `if` inside `founder_metrics()`. EXECUTE is now
  revoked from `anon` on every function, internal helpers are revoked from both
  client roles, and default privileges are altered so the next function does not
  inherit a grant nobody asked for.
- **Two functions had a mutable `search_path`** (`is_academic_domain`,
  `campus_name_from_domain`) and are called from a SECURITY DEFINER trigger.
  Both are now pinned to `public`.
- **`listing-photos` did not exist.** Created public, 10 MB, images only, with
  read-for-all and write-only-inside-your-own-folder policies.

Known gaps, in the order they will matter:

1. No rate limiting on posting or messaging — a signed-in account can insert as
   fast as it likes. Wants a trigger counting recent rows per user.
2. The report button flashes a toast; there is no moderation queue behind it.
3. No per-account storage quota, and no scanning of what is uploaded.
4. Free plan has no backups. The Pro plan's daily backups are the first thing to
   buy when there is real data.
5. No account-deletion flow.
