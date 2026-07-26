# Handoff

A campus give-away & resale board — v1, trialing at Columbia.

Students post things they no longer want; other students on the **same campus**
claim them (free) or buy them (cheap). The only trust mechanism is a verified
school email plus a public per-user **handoff count** — no payments, no shipping,
no accounts without a school email. Every campus is its own isolated board.

This repository implements the design handoff (`Student marketplace scope`) as a
**React + Vite + TypeScript** app rendered inside an iPhone frame, so the whole
10-screen flow is clickable in a browser. It's deployed on Vercel:
**https://handoff-bay-two.vercel.app**. The design language is a strict
flat/modernist system: **zero border radius anywhere**, everything **flush left**,
2px rules instead of shadows, a single accent red on a light ground, Archivo
throughout.

## Running it

```bash
npm install
npm run dev        # start the dev server (Vite)
npm run build      # type-check (tsc) + production build
npm run preview    # serve the production build
```

Open the printed URL. The left column is design rationale and a "walk the flow"
jump list; the phone bezel on the right is the product. Neither the column nor
the bezel ships — the app is only what is inside the frame.

## What's here

Screen state is a single enum (`gate | browse | detail | claim | chat | chats |
post1 | post2 | posted | me`). All state and behavior live in one hook
(`src/lib/useHandoff.ts`), split from the screens the way a production app would
split by feature.

- **Gate** — the one thing that makes the product different (school-email
  verification), then sign in.
- **Board** — the live campus feed with Free / For sale / Wanted segments, a
  seasonal move-out banner, and a day-7 "stale" nudge.
- **Detail** — a listing with seller reputation and the public meetup spot.
- **Claim / meetup** — agree on a public place by *rule*, not a curated list;
  the app never assumes it knows a campus's geography.
- **Chat** — the thread, with the agreed handoff pinned at the top.
- **Post** — photo (one tap), then **one paragraph, no form**: the app reads
  name, price, category, condition, meetup spot and pickup time out of the
  sentence and lets any of it be corrected in one tap.
- **Me** — identity, the day-7 freshness decisions, paused listings, saved
  searches, and move-out mode.

### The paragraph parser

`src/lib/parse.ts` is the piece of real logic worth reading — it turns a plain
sentence into a listing (price / free / title / category / condition / spot /
when), with any user "Fix" becoming an override that wins over the parse. In
production this becomes a server-side extraction (or an LLM call), but the UX
contract is fixed: **show what was understood, let any of it be corrected in one
tap, and never block posting on a field.**

## Project layout

```
src/
  data/          seed listings, wanted posts, spots, the signed-in user, types
  lib/           parse.ts (paragraph → listing) and useHandoff.ts (all state)
  components/    IOSDevice, TabBar, Switch, Toast — shared building blocks
  screens/       one file per screen
  styles/        tokens.css (the Modernist design system) + app.css (the shell)
  Notes.tsx      the design-rationale column (presentation only)
  App.tsx        composes the frame + current screen
```

## Backend (Vercel + Supabase)

The deployed app runs on in-memory seed data. Turning it into a real,
persistent, multi-user marketplace is a Supabase job — Auth (verified school
email), Postgres with campus-isolation row-level security, Realtime chat,
Storage for photos, and Edge Functions for the day-7 cron and paragraph
extraction. The Postgres schema and RLS are already written in
`supabase/migrations/0001_init.sql`, and the client is in `src/lib/supabase.ts`
(a no-op until env vars are set, so the prototype keeps working meanwhile).

See **[SUPABASE.md](./SUPABASE.md)** for the architecture, the spec-to-Supabase
mapping, and the exact setup steps.

## Design system

`src/styles/tokens.css` is ported verbatim from the handoff's
`design-system/styles.css` and is the source of truth for color, type, spacing,
radius and the component classes (`.btn`, `.input`, `.seg`, `.radio`, `.tag`,
`.hr`). Retune the look there rather than hard-coding values. Icons are
[Lucide](https://lucide.dev); type is Archivo.

## Not built yet (recommended next work)

The **handoff confirmation loop** — both parties tap "handed off" in the chat,
which releases the 3-hour hold and increments both handoff counts. That count is
the app's primary success metric (handoffs per week per building), and the
prototype deliberately never increments it. Also implied but not built: loading
and offline feeds, image-upload progress and failure, expired-hold recovery,
blocked-user views, empty boards on a brand-new campus, and the read-only state
after a failed per-term re-verification.
