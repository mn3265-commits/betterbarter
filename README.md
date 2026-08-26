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

The app runs on a live Supabase backend: Google (LionMail) sign-in, a
campus-isolated Postgres board enforced by row-level security, realtime chat,
Storage for photos. Pushes to this branch auto-deploy to Vercel.

See **[SUPABASE.md](./SUPABASE.md)** for the architecture, what is live, the
two remaining dashboard steps (photo bucket + the day-7 cron), and how to add
another campus.

`?showcase` renders the original design walkthrough — phone frame, scope notes,
seed data — with no account needed.

## Design system

`src/styles/tokens.css` is ported verbatim from the handoff's
`design-system/styles.css` and is the source of truth for color, type, spacing,
radius and the component classes (`.btn`, `.input`, `.seg`, `.radio`, `.tag`,
`.hr`). Retune the look there rather than hard-coding values. Icons are
[Lucide](https://lucide.dev); type is Archivo.

## The confirmation loop

Both people tap **handed off** in the thread. The second tap is the one with
consequences: it closes the listing, releases the 3-hour hold, writes the record
into the conversation, and adds **+1 to both handoff counts** — the app's only
reputation signal and its primary success metric (handoffs per week per
building). A browser cannot do that on its own, since nobody may write another
person's profile row, so it runs in one server-side function
(`set_handoff_done`, migration `0005`) that re-checks the caller is one of the
two participants and locks the thread so a simultaneous tap can only count once.
Until the other side answers, your own tap is undoable.

## Not built yet (recommended next work)

Implied but not built: loading
and offline feeds, image-upload progress and failure, expired-hold recovery,
blocked-user views, empty boards on a brand-new campus, and the read-only state
after a failed per-term re-verification.
