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
| Handoff-count confirmation loop | ⏳ not built (see below) |

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
  with `https://handoff-bay-two.vercel.app/**` in Redirect URLs.
- The client uses the **implicit** flow so a magic link still completes when the
  email opens it in a different browser than the one that asked for it.
- Sign-up is gated server-side: `handle_new_user()` maps the email domain to a
  campus and rejects anything not enrolled. The app shows that person a clear
  "not a campus we run yet" screen.

While the Google OAuth consent screen is in **Testing**, only accounts added as
test users can sign in, and they see an "unverified app" interstitial. Publish
the consent screen when you want the whole campus to be able to log in.

## The next real piece of work

The **handoff confirmation loop**: both people tap "handed off" in the thread,
which releases the hold and increments both `profiles.handoffs`. The columns
exist (`threads.buyer_done`, `threads.seller_done`), the UI does not. That count
is the app's only reputation signal and its primary success metric — handoffs
per week per building — so it is the thing worth building next.
