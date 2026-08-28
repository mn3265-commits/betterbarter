# SwapUp

A campus give-away & resale board — v1, trialing at Columbia.

Students post things they no longer want; other students on the **same campus**
claim them (free) or buy them (cheap). The only trust mechanism is a verified
school email plus a public per-user **handoff count** — no payments, no shipping,
no accounts without a school email. Every campus is its own isolated board.

This repository is the whole thing: a **React + Vite + TypeScript** app at
`/app`, a public site at `/`, and the original design walkthrough — the 10-screen
flow inside an iPhone frame — at `/?showcase`. It's deployed on Vercel:
**https://handoff-bay-two.vercel.app**. The design language is a strict
flat/modernist system: **zero border radius anywhere**, everything **flush left**,
2px rules instead of shadows, a single accent red on a light ground, Archivo
throughout.

## Four ways an object moves

A listing carries a `kind`: **free**, **sale**, **trade** or **rent**. The first
three transfer the object; a rental comes back, which is the one asymmetry the
impact model cares about — a loan is counted as a reuse event and earns **no**
avoided-production credit, because nobody outside the two students can say a
purchase was truly prevented.

What stays cut is the part that made trade and rent dangerous in v1: deposits,
escrow and damage adjudication. SwapUp still holds no money and settles no
disputes — a rental is two students and a promise, like every other handoff
here, and the community rules say so in the text every account agrees to.

## The impact model

`src/lib/impact.ts` is the one place a confirmed handoff becomes a circularity
number, and it is written to keep the three levels apart:

| Level | Number | Status |
| --- | --- | --- |
| 1 | Confirmed handoffs — both people tapped "handed off" | **Measured** |
| 2 | Mass kept in use = count × typical mass for the category | Estimated |
| 3 | Production avoided = mass × low-end cradle-to-gate factor × displacement | Estimated, conservative |

Displacement is held at **0.5**: a reused object only avoids manufacturing when
it stops someone buying a new one, and we assume that happens half the time.
Forecasts use an assumed move-out category mix weighted toward small things, so
the estimate is not quietly carried by bikes and laptops. The site renders the
whole factor table from this file, so the page and the model cannot drift.

## Routes

| Path | What it is |
| --- | --- |
| `/` | The public site — what SwapUp is, how a handoff works, the impact model, the rules, the FAQ. Sendable to someone who has never heard of it. |
| `/about` | The vision: a self-sufficient community that cares about people and planet — where it came from, what it refuses to be talked out of, and who is building it. |
| `/app` | The product. Sign-in gate, board, chat, posting, Me. |
| `/?showcase` | The original design walkthrough: phone frame, scope notes, seed data, no account needed. |

The site and the app are one Vite bundle with a path switch in `App.tsx`, so
there is no router dependency and no second deploy. `vercel.json` rewrites every
path to `index.html` so `/app` survives a hard refresh.

`/app` is both a **desktop web app and an installable PWA**. Below 1000px it is
the phone layout with the bottom tab bar; above it the tab bar stands up into a
left rail, the board spreads into as many columns as fit, and reading screens
stay at a column width instead of stretching. `public/manifest.webmanifest` plus
`public/sw.js` make it installable: navigations are network-first with the shell
as fallback, hashed assets are cache-first, and **nothing from Supabase is ever
cached** — a stale board would be a lie about what is still available.

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
(`src/lib/useSwapUp.ts`), split from the screens the way a production app would
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
  lib/           parse.ts (paragraph → listing) and useSwapUp.ts (all state)
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

`src/styles/tokens.css` is the source of truth for color, type, spacing, radius
and the component classes (`.btn`, `.input`, `.seg`, `.radio`, `.tag`, `.hr`).
Retune the look there rather than hard-coding values — the red-to-green move and
the softening pass were both single-file edits, which is the point.

Type is **Fraunces** for headings and **Plus Jakarta Sans** for everything you
read or click; corners are 6/10/16px rather than zero, and rules are 1px at 22%
rather than 2px at 40%. The original setting (Archivo, hard edges, heavy rules)
was right for a notice board and too severe for a product about neighbours
giving each other things. Icons are [Lucide](https://lucide.dev).

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
