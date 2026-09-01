# BetterBarter — SEE THE FUTURE 2026
## Paste-ready answers

Everything below is text to put in the form. No notes, no alternatives, no
commentary — those live in the full document next to this one.

The repo copy omits the phone number. The copy in ~/Downloads has it, because
that is the one you type from — and it is the one not to send to anyone.

---

## Section 1 — Contact

| Field | Answer |
| --- | --- |
| Primary Contact Name | Mohammad Agung Nugroho |
| Email | moh.agungnugroho@gmail.com |
| Phone Number | see `pitch/contact.local.md` (kept out of this public repo) |
| Country / Region | United States |
| Organization / University | Columbia University, School of Professional Studies |
| Team size | 2 |

## Team Members & Roles

**Agung Nugroho — Co-Founder, Tech and Product.** Designs the Marketplace,
writes the code, owns the impact model and runs the Columbia pilot. Graduate
student and Graduate Assistant at Columbia SPS; background in
customer-lifecycle and CRM marketing at telecommunications scale.

**Tessa Wong — Co-Founder, Strategy and Community.** A sustainable development
professional by background. She began her career as a management consultant at
Accenture Singapore, before pivoting to sustainable development research and
consulting — first for the development sector in Cambodia, then for the private
sector in Singapore.

## Startup / Project Name

**BetterBarter**

## One-Sentence Project Description (max 30 words)

BetterBarter is a verified campus marketplace where students give, sell and swap what they already own — so a working desk lamp finds its next owner, not a dumpster.

*(29 words)*

## Focus areas

- ✅ **Circular Economy** *(primary)*
- ✅ **Climate Change Mitigation, Adaptation, Clean Energy & Decarbonization** *(avoided production emissions)*

---

## What environmental problem are you solving?

A residential campus throws out most of a year's durable goods in a single week.
At move-out, working lamps, mini-fridges, rugs, textbooks and coats go into the
same dumpsters — not because students want to discard them, but because listing
an item takes longer than carrying it downstairs, and because the alternative to
the dumpster is meeting a stranger from a public marketplace off campus. Eight
weeks later the next intake buys the identical objects new, often financed on
money they do not have.

The category is enormous. The EPA puts US furniture and furnishings at **12.1
million tons generated in 2018, 80.1% of it landfilled**, and textiles at **17
million tons generated, 11.3 million tons landfilled**. There are **15.4 million
US undergraduates**, and every one of them moves in and out of somewhere.

Existing responses are one-week, staffed, one-way donation drives, bound by
trucks, storage and volunteer hours. Nothing runs on the ordinary Tuesday when
the decision to bin the chair is actually made.

**The waste is downstream of a user-experience problem, and that is the part
nobody has built for.**

## Describe your Solution

BetterBarter is a marketplace that exists once per campus and is visible only to people holding that school's email address. Students give away, sell, swap or rent the things they already own, to people who are already inside the same few buildings.

The community supplies itself. Everything on it is already on campus — the desk, the mini fridge, the textbook, the winter coat — so a school stops buying in what it already holds in surplus. We collect nothing, sort nothing, store nothing and resell nothing. Members find each other, agree the details in a thread, and meet at a library entrance or a dining hall door. When an object needs two people, another student on the same campus carries it for a fee paid directly between them, which turns a logistics cost into a campus job.

That is what makes the transport term zero rather than small. No van, no collection round, no warehouse, no packaging, no postage. Two people crossing a campus they were crossing anyway emit nothing extra — a claim no shipped resale platform and no staffed donation drive can make, because both of them move the object again after the owner is finished with it.

And it is counted at the object rather than at the truck. Both people confirm the exchange in person using a six-digit code split across their two phones, three digits each, so a single reuse event is recorded with its category and its date. That is a circularity figure a sustainability office can put in a report and defend line by line, instead of a weight estimated afterwards in aggregate.

## Market size — TAM / SAM / SOM

Two ways of counting, because a climate judge and an investor are asking
different questions. Both are built from published figures and our own published
model, and the arithmetic is shown so it can be checked.

### The material in play

| | Figure | Derivation |
| --- | --- | --- |
| **TAM** | **≈46M objects a year · ≈159,000 t · ≈333,000 t CO₂e** | 15.4M US undergraduates (NCES) × 3 reusable objects each per year, at our published averages of 3.45 kg and 7.2 kg CO₂e avoided per object |
| **SAM** | **≈14M objects · ≈48,000 t** | The ~30% of students on residential campuses dense enough for a board to work |
| **SOM (3 years)** | **≈300,000 objects · ≈1,000 t** | 25 campuses at a 15% participation rate |

### The revenue — campus licences

| | Figure | Derivation |
| --- | --- | --- |
| **TAM** | **≈$58M a year** | 3,896 US degree-granting institutions (NCES, 2022-23) × a $15k campus licence |
| **SAM** | **≈$18M a year** | ~1,200 residential four-year campuses where move-out density makes the product work |
| **SOM (year 3)** | **≈$375k a year** | 25 licensed campuses — roughly 2% of the serviceable set |

The licence price is anchored on a cost the university already carries: waste
hauling at move-out, plus the circularity reporting it has to produce anyway.
Verified-audience placements are additional and deliberately excluded here.

## Current stage

**Working product, pre-pilot.** Deployed and running on a live backend, not a
mockup: university single sign-on, campus-isolated Postgres with row-level
security, realtime chat, photo storage, the day-7 freshness check, a
community-rules gate, a pre-post safety check, the both-sides handoff
confirmation, ratings, and an installable PWA that is also a full desktop web
app. Two verified accounts exist; the board has not yet been opened to residents.
The pilot is scoped for the coming term, ahead of the May 2027 move-out peak.

## What makes your solution innovative?

1. **Reuse measured at the object, not at the truck.** Donation drives report a
   weight after the fact, in aggregate, with no way to audit it. We record one
   confirmed event per object, with category and timestamp, agreed by both
   parties — a bottom-up circularity metric a sustainability office can put in a
   report and defend line by line.
2. **The measurement is the reputation, and it has to be earned.** The act that
   counts the reuse is the act that raises both people's public handoff count, so
   the incentive to record impact is intrinsic rather than bolted on. And the act
   is not a button: it is a six-digit code split across the two phones, half
   each, which cannot be assembled without both people being present. A reuse
   metric one person can raise alone is not a metric.
3. **An honest model, published in the open.** Three separated levels, low-end
   factors, displacement held at 0.5, and a category mix weighted toward small
   things rather than an average carried by bikes and laptops. We also give away
   the assumption most likely to be challenged before anyone asks: **a borrowed
   object earns no carbon credit at all**, because it comes back.
4. **Zero-logistics circularity, with the transport term named.** A 10 km
   collection round is roughly 2.5 kg CO₂e for one object even at the EPA's
   passenger-car factor, which flatters a van. Two students crossing a campus
   they were crossing anyway emit nothing extra — and heavy objects still move,
   because another student carries them for a fee.
5. **It feeds the programme Columbia already runs, rather than competing with
   it.** Columbia has Give + Go Green at check-out, the Green Sale each autumn,
   and Clean + Go Green bins — an award-winning, staffed operation that EcoReps
   champions. None of it is the thing we are replacing. Those programmes collect
   what is left at the end; a board moves things between students *before* the
   pile forms, which is both cheaper and better placed on the EPA hierarchy.
   What the board cannot rehome still belongs in Give + Go Green — the board's
   job is to take the easy majority out of the pile so staffed collection can
   deal with what actually needs handling. The natural first partner is the group
   already doing this work, not a blank campus.
6. **Self-serve campuses.** A university email domain maps to a campus
   server-side. A school with no board gets one the moment its first student
   signs in, named and marked from a registry of 7,328 academic domains. No
   waiting list, no launch, no code.

## Have you achieved any traction?

- **Live product** at https://betterbarter.vercel.app — a public site
  explaining the method, and the board itself behind university sign-in.
- **Shipped end to end:** verified sign-in, a Marketplace browsed by category
  with free / sale / swap colour-coded on every card and renting announced, a
  three-photo listing form with an optional "gone by" date, claim with a
  three-hour hold, realtime chat that refuses to send contact details, the
  day-7 freshness check running hourly, community rules, ratings, a profile with
  an impact dashboard, a desktop layout and an installable PWA.
- **Backend hardened:** row-level security on every table, an RLS-hardening pass
  after the security advisor, server-side sign-up gating on academic domains,
  database-level rate limits, a reporting and moderation queue, and a
  confirmation function that cannot double-count.
- **Handoffs are verified in person:** six digits split across the two phones,
  three each, with the column unreadable by any client. A reuse count that one
  person can raise alone is not a count.
- **Impact model v1.1 published** with its factor table, assumed mix and sources.
- **Open source:** https://github.com/mn3265-commits/betterbarter
- **Not yet:** paying customers, an institutional partnership, or pilot users.
  Two verified Columbia accounts, and both of them are us. No conversation with
  Housing, EcoReps or the Office of Sustainability has happened yet either. We
  would rather say that than inflate it — the pilot is scoped for this term, and
  the first fifty users are being invited during orientation week.

## Team Background

Built by **Agung Nugroho** and **Tessa Wong** at Columbia University.

Agung is a graduate student at the School of Professional Studies and a
Graduate Assistant. His professional background is customer lifecycle and CRM
marketing at telecommunications scale, where the daily problem is the same one
this product has: getting a very large number of ordinary people to complete
one specific action, and measuring honestly whether they did. He designed and
built the product — interface, parser, database schema and row-level security,
and the impact model.

Tessa Wong is a sustainable development professional by background. She began
her career as a management consultant at Accenture Singapore, before pivoting
to sustainable development research and consulting — first for the development
sector in Cambodia, then for the private sector in Singapore. She owns
strategy and community: the guidelines, the listing experience, and the route
into housing and sustainability offices.

Campus reuse does not fail on technology. It fails on adoption and on trust,
which are behaviour and product problems before they are engineering ones. Both
of us are also the users: we have each carried something working down a
stairwell in May because there was no better option by Friday.

## What impact do you expect your project to create?

**Near term — one campus, first pilot year.** A per-object, audited count of
reuse events on one Columbia residential population, with mass and avoided
production reported alongside and every estimate labelled as an estimate. Our own
conservative model puts one participating floor — 120 students, three items each
— at roughly **360 objects, 1.2 tonnes kept out of landfill and 2.6 tonnes CO₂e
of avoided production**. At one campus of 8,000: **83 tonnes and 173 tonnes
CO₂e**. The public site carries the calculator so anyone can run their own
numbers, or dispute ours.

**Structural.** The number that matters is not tonnage in year one; it is
*handoffs per week per building*. If reuse becomes the default first thought on
an ordinary Tuesday rather than an annual clear-out ritual, the same intervention
compounds at every campus it reaches — and it produces the dataset sustainability
offices currently have to guess at: what students actually discard, when, and in
what quantity.

**Behavioural and social.** Students who complete a handoff acquire a visible,
personal record of circular behaviour, and students who need an hour of paid work
get it by carrying things their neighbours cannot lift alone. Affordability and
emissions are the same transaction here, not a trade-off.

## Who benefits from your solution?

- **Students** — get furnished for free or nearly free, and dispose of things
  without guilt, a car, or a stranger. Some also earn: carrying heavy items is
  paid work that exists on every campus and is currently arranged, badly, in
  group chats.
- **International and low-income students, most sharply** — they arrive with
  nothing, buy everything new in one panicked week, and leave it behind eight
  months later. This turns that cycle into a loop.
- **The university** — fewer dumpsters at move-out, lower waste-hauling costs,
  and a measurable circularity number for its own climate reporting.
- **Sustainability offices and student groups** — a year-round instrument that
  complements rather than competes with the drives they already run: the board
  removes the easy majority from the pile so staffed collection can handle what
  is left.
- **The wider system** — every object rehomed is one production run not triggered
  and one landfill entry avoided.

## How could your solution scale?

**Technically, a school joins by someone signing in.** A university email domain
maps to a campus, row-level security keeps the boards isolated, and the campus is
named and marked automatically from a registry of 7,328 academic domains. The
product does not get harder with the tenth campus.

**Commercially, the constraint is density, not code.** A board with nothing on it
is worse than no board, so attention goes to one school at a time — all of
Columbia first, building by building — before recruiting a second. Growth follows
the residential calendar: move-in and move-out are the two moments when the whole
population has the same problem at once.

**Distribution runs through institutions, not advertising.** Housing,
sustainability offices, EcoReps and residence staff already own the move-out
problem and already send the emails students read. The impact model is the pitch
to them: an auditable circularity number they cannot produce today.

**Revenue is charged before a deal exists, never on the object.** A campus
licence is the main line. Verified-audience placements for movers, storage and
student services are second. Posting, claiming, giving and swapping stay free
permanently: a fee on a give-away is a tax on generosity and would defeat the
product.

---

## Additional Information

| Field | Answer |
| --- | --- |
| Company / Project website | https://betterbarter.vercel.app |
| Repository | https://github.com/mn3265-commits/betterbarter |
| LinkedIn Profile | https://www.linkedin.com/in/mohagungnugroho |
| Company Logo | `pitch/BetterBarter-logo.png` |

The live URL matches the name as of 29 August: **betterbarter.vercel.app**. A
custom domain is still worth about $12 a year if these become event materials —
`betterbarter.com` is taken, `betterbarter.app` and `betterbarter.co` are not —
but nothing on the form depends on it now.

## Sources used in these answers

- EPA, *Durable Goods: Product-Specific Data* — furniture and furnishings, 12.1M tons, 80.1% landfilled (2018)
- EPA, *Textiles: Material-Specific Data* — 17M tons generated, 11.3M tons landfilled (2018)
- EPA, *Sustainable Materials Management: the waste management hierarchy* — source reduction and reuse above recycling
- EPA, *Greenhouse Gas Emissions from a Typical Passenger Vehicle* — ~400 g CO₂ per mile
- NCES, *Undergraduate Enrollment* — 15.4M undergraduates
- NCES, *Digest of Education Statistics table 317.10* — 3,896 degree-granting institutions, 2022-23
- WRAP, *Environmental and Economic Benefits of Re-use* — displacement as the condition for any reuse saving
