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

The schema lives in `supabase/migrations/` — all of it, through 0024. Those files
were applied through the API rather than the CLI, so the numbering is local;
`supabase/migrations/README.md` maps each one to the version the project recorded.

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
| Day-7 auto-pause on no answer | ✅ pg_cron installed, hourly, verified running |
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
- **Site URL**: Authentication → URL Configuration → `https://betterbarter.vercel.app`,
  with `https://betterbarter.vercel.app/**` in Redirect URLs. Both sign-in
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

- **Nothing rate-limited anything.** A signed-in account could insert as fast as
  it liked. A `before insert` trigger now counts that account's own recent rows:
  15 listings an hour, 20 messages a minute, 10 posts and 10 reports an hour, 20
  carry offers an hour — set well above what a student does in a day and well
  below what a script does in a minute. Verified by running it: the 16th listing
  and the 21st message are both refused, with a sentence a person can read.
- **The report button showed a toast and did nothing else,** while the community
  rules promised it hid the account and flagged it for review. There is now a
  `reports` table, a `blocks` table, and a `report_account()` RPC that does both
  in one step — and the block is enforced inside the `listings_read` and
  `wanted_read` policies, so a blocked person's things stop appearing whatever
  the client does. Founders work the queue at `/ops` via `moderation_queue()`,
  which is a separate function from `founder_metrics()` so the aggregate view
  stays anonymous.

Known gaps, in the order they will matter:

1. No per-account storage quota, and no scanning of what is uploaded.
2. Free plan has no backups. The Pro plan's daily backups are the first thing to
   buy when there is real data.
3. Account removal is a deactivation, not a delete — deliberately. See below.
4. A rate limit that counts surviving rows can be reset by deleting them. Fine
   against noise, not against someone determined; a real counter would be its own
   table. Revisit if it is ever actually abused.
5. Nothing throttles sign-ups themselves — the campus wall (a verified academic
   address) is doing that job alone.


## The lifecycle (added 28 August 2026)

Nothing on the board is allowed to go stale, and nothing is deleted to achieve
that. A listing walks down a staircase, and its owner can stop it at any step:

| Day | What happens | Reversible? |
| --- | --- | --- |
| 7 | The owner is asked whether it is still here | — |
| 9 | No answer: it pauses itself, off the board | Relist, one tap |
| 30 | Still nothing: it comes off the owner's shelf into **Archived** | Relist, one tap |
| 90 | Its photos are released into `storage_reclaim` | No — but it only costs the photo |

A listing with a live conversation or a completed handoff never archives, however
old it is. "Still here", "Make it free" and "Relist" all stamp `confirmed_at`,
which puts it back at the top of the staircase.

`run_lifecycle()` runs hourly under pg_cron as job `betterbarter-life`. Before
28 August it did not run at all: `pg_cron` had never been installed, so the
scheduling block in 0003 raised a notice and moved on, and the day-7 check had
never fired once since the day it was written.

### Why the photos and not the rows

The whole database is **12 MB**. Ten thousand listings would add a handful more —
a listing row is a few hundred bytes. A photo is a few MB, and there can be four
to a listing, on a plan with **1 GB** of storage. That is four orders of
magnitude between the two, so the photos are the only thing worth reclaiming,
and the row (with its place in the impact ledger) is worth keeping forever.

Postgres cannot delete out of object storage. The job queues orphaned paths in
`storage_reclaim` and `/ops` empties the queue through the Storage API; anything
that fails to delete stays queued rather than being marked done.

### Why accounts are not on a timer

This product is seasonal. Someone lists a desk at move-out in May, vanishes for
the summer, and comes back at move-in in September. That is not a dormant user,
that is *the* user — a 30-day rule would deactivate exactly the people the whole
thing depends on. `/ops` shows a 90-day dormancy count so it is visible, and
nothing acts on it.

What accounts get instead is a door marked **"Take me off the board"**: listings
come down, wanted posts go, the profile leaves the board, and signing back in
undoes all of it.

### Why there is no hard delete

`threads.buyer_id`, `threads.seller_id`, `ratings.rater_id` and `ratings.ratee_id`
are all `ON DELETE CASCADE`, and `profiles → auth.users` is too. Deleting one
profile row would take every thread that person was ever in — including the other
side's completed handoff — plus every rating they wrote about other people, which
would silently reduce those students' rating counts.

None of that history is only theirs. A rating you wrote is someone else's
reputation; a handoff you completed is on someone else's record. So removal is a
deactivation, and the row stays. If a real erasure request ever arrives, the
right shape is to anonymise the profile row (name and email), not to delete it.
