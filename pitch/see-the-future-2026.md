# SEE THE FUTURE Startup Competition 2026 — Handoff

Columbia Climate School · SEE · F20 · Climate & Conservation Venture Competition
**Deadline: 2 September 2026 · Finalists notified 9 September**

Draft answers for the application form. Everything factual here matches what is
actually live at https://handoff-bay-two.vercel.app — nothing below claims a
user, a partner or a number the project does not have. Fields marked `[FILL]`
need something only you can answer.

## Submission checklist

| Item | Status |
| --- | --- |
| Every text field on the form | Drafted below — paste as-is |
| **Project introduction document (PDF, required)** | ✅ `pitch/Handoff-SEE-THE-FUTURE-2026.pdf` — 3 pages, one placeholder (Tessa's role) |
| Company / project website | https://handoff-bay-two.vercel.app |
| Logo (optional) | Not exported yet — the loop mark + wordmark is at `public/icon.svg`, and `public/icon-512.png` is a usable square |
| Phone, LinkedIn, team size | `[FILL]` |
| Tessa's role and background | `[FILL]` — appears in three places: the form, the PDF and /about |

---

## Primary contact

- **Name:** Mohammad Agung Nugroho
- **Email:** moh.agungnugroho@gmail.com
- **Phone:** `[FILL]`
- **Country / Region:** United States
- **Organization / University:** Columbia University, School of Professional Studies
- **Team size:** 2

## Team members & roles

> **Agung Nugroho — product and build.** Designs the board, writes the code,
> owns the impact model and runs the Columbia pilot. Background in
> customer-lifecycle and CRM marketing at telecommunications scale, currently a
> graduate student and Graduate Assistant at Columbia SPS.
>
> **Tessa Wong — `[FILL: role]`.** `[FILL: one or two sentences — what she owns
> on the project, plus the background that makes her the right person for it.]`

`[FILL — the roles need to be complementary on paper, not just two names. The
split judges find most credible for a venture like this is one person on
product/engineering and one on campus operations and partnerships (housing,
sustainability office, EcoReps, student groups) — if that matches how you two
actually work, say it in those words.]`

## Startup / Project name

**Handoff**

## One-sentence project description (max 30 words)

> Handoff is a verified campus reuse board where students give, sell, lend or
> swap what they already own — and every confirmed handoff is measured.
> *(24 words)*

## Focus areas

- **Circular Economy** — primary
- **Climate Change Mitigation, Adaptation, Clean Energy & Decarbonization** — secondary (avoided production emissions)

## What environmental problem are you solving?

A residential campus throws out most of a year's durable goods in a single week.
At move-out, working desk lamps, mini-fridges, rugs, textbooks and coats go into
the same dumpsters — not because students want to discard them, but because
listing an item takes longer than carrying it downstairs, and because the
alternative to the dumpster is meeting a stranger from a public marketplace off
campus.

Nationally the category is enormous: the EPA puts US furniture and furnishings
at **12.1 million tons generated in 2018, 80.1% of it landfilled**, and textiles
at **17 million tons generated, 11.3 million tons landfilled**. Campuses are the
sharpest version of that curve: the same building holds hundreds of people
disposing and hundreds arriving to buy the identical objects new, eight weeks
apart.

Existing responses are one-week, staffed, one-way donation drives — Columbia's
own Give & Go Green and Clean + Go Green — which do real work but are bound by
trucks, storage and volunteer hours, and can only run when the calendar allows.
Nothing runs on the ordinary Tuesday when the decision to bin the chair is
actually made.

**The waste is downstream of a user-experience problem, and that is the part
nobody has built for.**

## Describe your solution

Handoff is a campus-only reuse board where the exchange never leaves the
building.

- **Posting takes about twenty seconds.** One photo, then one sentence written
  the way you would text a friend. The app reads price, category, condition and
  meetup spot out of the sentence — no form — and any of it can be corrected in
  one tap. Friction is the thing that sends objects to the dumpster, so removing
  it *is* the intervention.
- **Four ways to keep an object in use.** Give it away, sell it cheap, lend it
  by the week, or swap it for something you need. Ownership is only one way to
  have a thing: a drill borrowed by six people is five drills that were never
  manufactured. What we deliberately do *not* add back is deposits, escrow or
  damage adjudication — a loan here is two verified students and a promise.
- **Meet on campus, not at anyone's home.** A library entrance, a dining hall
  door, a student centre, a department lobby. Nothing assumes you live in a
  hall, so commuters are first-class; the app will not accept a room number as a
  meetup spot.
- **Only your campus can see it.** One verified university email per account,
  enforced in the database, not in the interface. Every campus is an isolated
  board. That removes the stranger problem which stops students listing.
- **The exchange is two people and a doorway.** Claiming opens a conversation
  with the meetup already written into it and holds the item for three hours.
  No shipping, no packaging, no van, no warehouse — the lowest-carbon second
  life an object can have is the one that never leaves the building.
- **Both people confirm it happened.** That second tap is the measurement event:
  one object, verified as kept in use, by two people who both said so. It also
  raises each person's public handoff count, which is the entire reputation
  system.
- **The board keeps itself alive.** On day seven the app asks whether the item is
  still there; silence pauses the listing. A board full of things that already
  left is a dead board, and a dead board sends everything back to the dumpster.

Every confirmed handoff feeds a published impact model with three explicitly
separated levels: **measured** (confirmed handoffs), **estimated** (mass kept in
use), and **estimated and displacement-adjusted** (avoided production emissions,
at a conservative displacement rate of 0.5). The factor table, the assumed
category mix and the sources are printed on the public site and live in one file
in an open repository, so any number we publish can be checked or argued with.

## Current stage

**Working product, pre-pilot.** Not a mockup: the app is deployed and running on
a live backend — Google (LionMail) sign-in, campus-isolated Postgres with
row-level security, realtime chat, photo storage, the day-7 lifecycle, the
community-rules gate, the pre-post safety check, and the both-sides handoff
confirmation. Two verified Columbia accounts exist; the board has not been
opened to residents yet. The pilot is scoped for the coming term, ahead of the
May 2027 move-out peak.

## What makes your solution innovative?

1. **Reuse measured at the object, not at the truck.** Donation drives report a
   weight after the fact, in aggregate, with no way to audit it. Handoff records
   one confirmed event per object, with its category and a timestamp, agreed by
   both parties — a bottom-up, auditable circularity metric that a campus
   sustainability office can actually put in a report.
2. **The measurement is the reputation.** The same tap that counts the reuse
   raises both people's public handoff count. Being counted is not an
   afterthought bolted on for ESG reporting; it is what makes the marketplace
   trustworthy, so the incentive to record impact is intrinsic.
3. **An honest impact model, published in the open.** We refuse to state an
   estimate as a measurement: three separated levels, low-end factors, a
   displacement rate of 0.5, and an assumed category mix weighted toward small
   things rather than an average quietly carried by bikes and laptops. We also
   give away the assumption most likely to be challenged before anyone asks:
   **a borrowed object earns no carbon credit at all**, because it comes back.
   That is rare enough in reuse claims to be a differentiator with institutional
   buyers.
4. **Zero-logistics circularity, with the transport term named.** Collect, sort,
   store, resell is four touches and a vehicle: a 10 km collection round is
   roughly 2.5 kg CO₂e for one object even at the EPA's passenger-car factor,
   which flatters a van. Two students crossing a campus they were crossing
   anyway emit nothing extra, so our transport term is zero rather than small —
   and we say so rather than quietly omitting it.
5. **Verification as infrastructure, and self-serve campuses.** A university
   email domain maps to a campus server-side, so trust and isolation are
   database facts. A school with no board gets one the moment its first student
   signs in: the campus is created, then named and marked from a bundled
   registry of 7,328 academic domains. No waiting list, no launch, no code.

## Traction

- **Live product** at https://handoff-bay-two.vercel.app — deployed, on a real
  backend, not a prototype video. Public site, `/about` for the vision, and the
  board itself behind Columbia sign-in.
- **Installable PWA and a full desktop web app** — one codebase, a phone layout
  below 1000px and a navigation rail above it.
- **Any university can open a board**, which makes the pilot a choice about
  attention rather than a gate we control.
- **Ten screens shipped end to end:** verification gate, board with Free / For
  sale / Borrow / Swap / Wanted, listing detail, claim with a three-hour hold, realtime chat,
  paragraph-based posting, day-7 lifecycle, profile, community-rules agreement,
  first-run walkthrough.
- **Backend hardened:** row-level security migrations, RLS-hardening pass after
  the security advisor, a server-side sign-up gate that rejects non-campus
  domains, and a SECURITY DEFINER confirmation function that cannot be
  double-counted.
- **Impact model v1.0 published** with its factor table and sources on the
  public site.
- **Open source** at https://github.com/mn3265-commits/handoff.
- **Not yet:** paying customers, an institutional partnership, or pilot users.
  Two verified Columbia accounts. We would rather say that than inflate it.

`[FILL — if you have talked to anyone in Columbia Housing, Facilities, EcoReps
or Sustainable Columbia, even informally, name it here. One conversation with a
named office is worth more to these judges than three more shipped screens.]`

## Team background

`[FILL — expand with your own words; the frame below is accurate and short.]`

> Handoff is built by **Agung Nugroho** and **Tessa Wong** at Columbia
> University. Agung is a graduate student at the School of Professional Studies
> and a Graduate Assistant; his professional background is customer lifecycle
> and CRM marketing at telecommunications scale, where the daily problem is the
> same one Handoff has — getting a very large number of ordinary people to
> complete one specific action, and measuring honestly whether they did. He
> designed and built the product: interface, parser, database schema and
> row-level security, and the impact model.
>
> `[FILL: two or three sentences on Tessa — what she owns and the experience
> behind it.]`
>
> The combination matters here: campus reuse does not fail on technology, it
> fails on adoption and on trust, and those are behaviour and product problems
> before they are engineering ones. Both of us are also the users — we have each
> carried something working down a stairwell in May because there was no better
> option by Friday.

## What impact do you expect your project to create?

**Near term (one campus, first pilot year).** A per-object, audited count of
reuse events on one Columbia residential population, with mass and avoided
production reported alongside — and every estimate labelled as an estimate. Our
own conservative model puts a single participating floor of 120 students, each
handing off three items, at roughly **360 objects, 1.2 tonnes kept out of the
landfill and 2.6 tonnes CO₂e of avoided production**, using low-end factors and
a 0.5 displacement rate. The public site carries the calculator so anyone can
run their own numbers or dispute ours.

**Structural.** The number that matters is not tonnage in year one; it is
*handoffs per week per building*. If reuse becomes the default first thought on
an ordinary Tuesday rather than an annual clear-out ritual, the same
intervention keeps compounding at every campus it reaches, and it produces the
dataset — what students actually discard, when, and in what quantity — that
sustainability offices currently have to guess at.

**Behavioural.** Students who complete a handoff acquire a visible, personal
record of circular behaviour. We are betting that a public count of real reuse
events changes the default more durably than a poster above a bin does.

## Who benefits from your solution?

- **Students** — get furnished for free or nearly free, and dispose of things
  without guilt, a car, or a stranger.
- **International and low-income students**, most sharply: they arrive with
  nothing, buy everything new in one panicked week, and leave it behind eight
  months later. Handoff turns that cycle into a loop.
- **The university** — fewer dumpsters at move-out, lower waste-hauling costs
  and a measurable circularity number for its own climate reporting.
- **Sustainability offices and student groups** — a year-round instrument that
  complements, rather than competes with, the drives they already run: the board
  removes the easy majority from the pile so staffed collection can handle what
  is left.
- **The wider system** — every object rehomed is one production run not
  triggered and one landfill entry avoided.

## How could your solution scale?

**Technically, adding a campus is one database row.** A school email domain maps
to a campus; row-level security keeps the boards isolated with no code change
and no possibility of leakage between schools. The product does not get harder
with the tenth campus.

**Commercially, the constraint is density, not code.** A board with nothing on
it is worse than no board, so we go one school at a time: all of Columbia first,
building by building, before a second campus. Growth follows the residential
calendar — move-in and move-out are the two moments when the whole population
has the problem simultaneously.

**Distribution runs through institutions, not ads.** Housing, sustainability
offices, EcoReps and residence-hall staff already own the move-out problem and
already send the emails students read. The impact model is the pitch to them:
they get an auditable circularity number they currently cannot produce.

**Revenue is charged before a deal exists, never on the object.**

1. **Campus licence — the main line.** Housing and sustainability offices already
   pay to haul this material away and already have to report circularity. A
   licensed campus gets the admin tools, the move-out programme and an audited,
   object-level number they cannot produce today. That is an existing budget
   spent against an existing cost, and it is an institutional sale rather than a
   consumer one.
2. **Verified-audience placements.** Movers, storage, print shops and student
   services reaching one campus in the one fortnight of the year when the whole
   population has the same problem. Paid up front, clearly marked, never mixed
   into the board's ranking.
3. **Free permanently, on the object path.** Posting, claiming, giving away,
   lending and swapping. No listing fee, no cut of a handoff, no charge to a
   student for the thing itself — a fee on a give-away is a tax on generosity
   and would defeat the product. If payments are ever added it is as an option
   on paid items only, with the fee on that path alone.

## Additional information

- **Project website:** https://handoff-bay-two.vercel.app
- **Repository:** https://github.com/mn3265-commits/handoff
- **LinkedIn:** `[FILL]`
- **Logo:** `[FILL — the HANDOFF wordmark from the site, exported at high
  resolution, is the fastest acceptable answer]`

## Project introduction document (PDF, required)

Not written yet. It should be one to three pages and can be assembled almost
entirely from the sections above: problem → solution → current stage → impact
model with the factor table → team → traction → what the pilot needs. Say the
word and I will lay it out in the product's own design system and export it.
