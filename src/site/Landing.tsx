import { useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Camera,
  Check,
  Footprints,
  HandHeart,
  MapPin,
  Repeat2,
  ScanLine,
  Sparkles,
  Truck,
} from 'lucide-react'
import { RULES, RULES_SUMMARY } from '../lib/rules'
import {
  CAR_KG_CO2E_PER_KM,
  DISPLACEMENT,
  FACTORS,
  MIX,
  impactOfItem,
  MODEL_VERSION,
  SOURCES,
  co2eLabel,
  forecast,
  kgLabel,
} from '../lib/impact'
import { BarChart, type Row } from './BarChart'
import { categoryColor } from '../components/CategoryIcon'
import { CountUp } from './CountUp'
import { Hierarchy } from './Hierarchy'
import { Seasonality } from './Seasonality'
import { Reveal } from './Reveal'
import { SiteFooter, SiteNav } from './SiteChrome'
import '../styles/site.css'

/**
 * The public front door at `/`. The product itself lives at `/app`.
 *
 * The page has one job the app cannot do: explain why a campus reuse board is a
 * circular-economy intervention rather than a classifieds app — what gets kept
 * in use, how it is counted, and which part of that number is measured versus
 * estimated. Everything quantitative on this page comes from `lib/impact.ts`,
 * so the site and the model can never drift apart.
 *
 * Same design system as the product (tokens.css): zero radius, flush left, 2px
 * rules, one accent red.
 */

const APP = '/app'

const SEGMENTS: [string, string][] = [
  ['For free', 'The thing that would otherwise go in a hallway or a dumpster. Someone on your floor takes it today.'],
  ['For sale', 'Cheap, and settled between the two of you. The app never touches the money.'],
  ['For rent — opening soon', 'One drill can serve a whole floor. Renting needs a second meeting to bring the thing back, so it is announced rather than live: on the Marketplace, marked, and switched on once returns are handled properly.'],
  ['For swap', 'Your heater for their fan. Two objects stay in use, and neither of you buys anything.'],
  ['Looking for', 'The Marketplace in reverse: say what you need before you buy it new, and let the person holding it find you.'],
  ['Needs a hand', 'A fridge is not a one-person object. Students with an hour and a trolley carry it, paid directly — no van, no company.'],
]

const PROBLEM: [string, string, string][] = [
  ['12.1M', 'tons', 'of furniture and furnishings thrown out in the US in one year — 80.1% of it landfilled.'],
  ['17M', 'tons', 'of textiles generated in the same year; 11.3M tons went straight to landfill.'],
  ['1 week', 'in May', 'is when a residential campus throws out most of its year — all at once, into the same dumpsters.'],
]

const STEP_ICONS = [Camera, ScanLine, MapPin, Check]

const STEPS: [string, string, string][] = [
  [
    '01',
    'Post it in about twenty seconds',
    'One photo where the thing stands, then a sentence written the way you would text a friend. The app reads the price, category, condition and meetup spot out of your own words. Nothing is thrown out because listing it felt like paperwork.',
  ],
  [
    '02',
    'Someone on your campus takes it on',
    'The Marketplace only ever shows your school, closest halls first. They can take it free, buy it cheap, rent it for a week, or offer you something of theirs for it. The item is held for three hours so two people are not walking to the same lobby.',
  ],
  [
    '03',
    'You meet somewhere on campus',
    'A library entrance, a dining hall door, a student centre, a department lobby — wherever you both already are on an ordinary day. You do not have to live on campus, and nobody goes to anyone’s home: the exchange is two students and a doorway, with no shipping, no packaging, no van and no warehouse.',
  ],
  [
    '04',
    'Both of you confirm it happened',
    'That second tap is what turns an intention into a measured reuse event: one object, verified as kept in use, by two people who both said so. Every number on this page is built out of that one event.',
  ],
]

const WHY_ICONS = [CalendarClock, HandHeart, Footprints, Truck, BadgeCheck, Repeat2, Sparkles]

const WHY: [string, string][] = [
  [
    'Year-round, not one week in May',
    'Donation drives run when the trucks are booked. A board runs on the Tuesday you actually decide to get rid of the chair, which is when the decision to bin it is really made.',
  ],
  [
    'Peer-to-peer, so nothing is handled twice',
    'Collect, sort, store, resell is four touches and a vehicle. Building to building is one walk. Reuse loses its advantage the moment logistics get involved.',
  ],
  [
    'Heavy things move without a vehicle',
    'The alternative to a van is not "nobody can shift a fridge" — it is a student with an hour and a trolley, paid directly by whoever needed the help. Campus jobs instead of logistics costs, and a public carry count for the people who do them.',
  ],
  [
    'No transport term to subtract',
    `A van doing a collection round burns fuel per item, and an honest reuse figure has to subtract it — a 10 km round trip is about ${(10 * CAR_KG_CO2E_PER_KM).toFixed(1)} kg CO₂e for that one object, using a car factor, which flatters the van. Two people crossing a campus they were crossing anyway emit nothing extra, so our transport term is zero rather than small.`,
  ],
  [
    'Counted at the object, not the truck',
    'Drives report weight after the fact, in aggregate. BetterBarter records one confirmed event per object, with its category — so the number is auditable from the bottom up.',
  ],
  [
    'Verified people, so reuse is not risky',
    'The reason students bin a working lamp instead of listing it is strangers. One verified school email per account, one campus per board, and a public handoff count.',
  ],
  [
    'It complements the drives, it does not replace them',
    'What the Marketplace cannot rehome still belongs in Give & Go Green and Clean + Go Green. The Marketplace removes the easy 80% from the pile so staffed collection can deal with the rest.',
  ],
  [
    'A board that cleans itself',
    'On day seven the app asks whether the thing is still there. Silence pauses the listing — a board full of things that already left is a dead board, and a dead board sends everything back to the dumpster.',
  ],
]

const NOT: [string, string][] = [
  ['Not a fee on the handoff', 'No listing fee, no cut of a give-away, no charge for renting. Money between two students moves the way it already does — see how this pays for itself, above.'],
  ['Not a deposit holder', 'Renting is a promise between two people on the same campus, not a contract we underwrite. We hold nothing and adjudicate nothing.'],
  ['Not a shipping or storage service', 'Nothing is collected, warehoused or driven anywhere. Logistics is exactly what makes reuse cost more than it saves.'],
  ['Not one board for everyone', 'Every school gets its own isolated board. A national marketplace is exactly the stranger problem we removed.'],
]

const FAQ: [string, string][] = [
  [
    'Who can sign in?',
    'Anyone with a working university email address — .edu, .ac.uk, .edu.au, .ac.id and the rest of the academic namespaces. The domain is checked server-side, so a personal address cannot get onto any board, and your board only ever contains people from your own school.',
  ],
  [
    'My university is not on here yet. Can I use it?',
    'Yes — signing in creates it. The first person to arrive from a school opens that school\u2019s board, and it is theirs from that moment: separate from every other campus, named and marked with their own institution. There is no waiting list and nothing for us to approve.',
  ],
  [
    'How is the impact number calculated?',
    'Confirmed handoffs are counted directly. Mass is that count times a typical mass for the item’s category. Avoided emissions are that mass times a low-end production factor, times a displacement rate of ' +
      DISPLACEMENT +
      ' — because a reused object only avoids manufacturing when it stops someone buying a new one. The whole table is published below and lives in one file in the open-source repository.',
  ],
  [
    'Who carries the heavy things?',
    'Another student. A listing can be marked as needing two people or a trolley, which surfaces it to anyone on the same campus who wants an hour of work; the fee is suggested by the owner and paid directly between them, exactly like every other payment here. Completed carries show as their own public count. No van is dispatched, so nothing about this adds a transport term to the impact figures.',
  ],
  [
    'Why does renting not count toward the carbon number?',
    'Because the object comes back. Renting avoids a purchase for the person who rented it, but the owner still owns it, and nobody outside the two of them can say a purchase was truly prevented. So a rental is counted and reported as a reuse event, and earns no avoided-production credit at all — the assumption most likely to be challenged, given away before anyone asks.',
  ],
  [
    'Who is responsible if a rented thing breaks?',
    'The two of you. BetterBarter holds no deposit, no escrow and no insurance, and it will not decide who broke what — rent out only what you can afford to lose, agree the return date in the thread, and bring things back in the state you got them. That is in the community rules every account agrees to.',
  ],
  [
    'Does it cost anything?',
    'No. Free things are free, sold things are paid between the two of you however you already pay each other. BetterBarter takes no cut and holds no money.',
  ],
  [
    'Where do we actually meet?',
    'Somewhere public on campus, with other people around — a library entrance, a dining hall door, a student centre, a department lobby, a campus gate. Commuters are not at a disadvantage: nothing here assumes you live in a hall, and nobody ever goes to anyone’s home. The app will not let a room number stand in for a meetup spot, and it does not publish where you live.',
  ],
  [
    'What if someone does not show up?',
    'A claim holds the item for three hours and takes it away from someone else, so the rule is simple: show up, or send one message. Two no-shows and claiming is suspended for a week.',
  ],
  [
    'What can I not post?',
    'Nothing dangerous or illegal: weapons, drugs and prescriptions, alcohol and vapes, IDs and keys, stolen or university-owned property, coursework meant to be handed in. The app checks a listing before it posts and says why.',
  ],
  [
    'What are you concentrating on right now?',
    'They already have it: a university email opens a board. What we are deliberately not doing is spending attention everywhere at once — the first campus has to be dense enough to be useful on an ordinary Tuesday before we go and recruit the second.',
  ],
]

/** The assumed category mix, drawn as the material flow it is. */
function MixBar() {
  const rows = Object.entries(MIX).sort((a, b) => b[1] - a[1])
  return (
    <div className="site__mix">
      <div className="site__mixbar">
        {rows.map(([cat, share]) => (
          <div
            key={cat}
            className="site__mixbar-seg"
            style={{ width: share * 100 + '%', background: categoryColor(cat) }}
            title={cat + ' · ' + Math.round(share * 100) + '%'}
          />
        ))}
      </div>
      <div className="site__mixkey">
        {rows.map(([cat, share]) => (
          <div key={cat}>
            <i style={{ background: categoryColor(cat) }} />
            {cat} <b>{Math.round(share * 100)}%</b>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The same 100 handoffs, measured twice. Two single-series charts rather than
 * one two-series chart, because mass and emissions do not share a scale — and
 * because the interesting thing is that they do not agree: clothes and small
 * kitchen things dominate the count, furniture dominates the weight, and eight
 * laptops carry more avoided production than everything else put together.
 */
function HundredHandoffs() {
  const cats = Object.keys(MIX)
  const mass: Row[] = cats
    .map((c) => {
      const one = impactOfItem(c)
      const n = MIX[c] * 100
      return {
        label: c,
        value: one.kg * n,
        display: kgLabel(one.kg * n),
        color: categoryColor(c),
        note: `${Math.round(n)} items × ${FACTORS[c].kg} kg`,
      }
    })
    .sort((a, b) => b.value - a.value)

  const carbon: Row[] = cats
    .map((c) => {
      const one = impactOfItem(c)
      const n = MIX[c] * 100
      return {
        label: c,
        value: one.co2e * n,
        display: co2eLabel(one.co2e * n),
        color: categoryColor(c),
        note: `${FACTORS[c].efPerKg} kg CO₂e per kg, halved for displacement`,
      }
    })
    .sort((a, b) => b.value - a.value)

  return (
    <div className="site__charts">
      <figure>
        <figcaption>Mass kept in use</figcaption>
        <BarChart rows={mass} unit="Kilograms, per 100 confirmed handoffs" />
      </figure>
      <figure>
        <figcaption>Production avoided</figcaption>
        <BarChart rows={carbon} unit="kg CO₂e, per 100 confirmed handoffs · rentals excluded" />
      </figure>
    </div>
  )
}

/**
 * The same forecast at four scales. Nothing new is assumed — it is the model
 * multiplied — but seeing a floor, a building, a campus and ten campuses in one
 * column is what makes the shape of the opportunity legible.
 */
const SCALES: [string, number, string][] = [
  ['One floor', 120, '120 students'],
  ['One building', 600, '600 students'],
  ['One campus', 8000, '8,000 students'],
  ['Ten campuses', 80000, '80,000 students'],
]

function ScaleLadder() {
  const rows: Row[] = SCALES.map(([label, students, note]) => {
    const out = forecast(students, 3)
    return {
      label,
      value: out.co2e,
      display: `${kgLabel(out.kg)} · ${co2eLabel(out.co2e)}`,
      note: `${note} × 3 items = ${out.items.toLocaleString()} objects`,
    }
  })
  return <BarChart rows={rows} unit="Mass kept in use and production avoided, at three items per participating student" />
}

/** The forecast tool: what one floor, one building or one class year moves. */
function Estimator() {
  const [students, setStudents] = useState(120)
  const [each, setEach] = useState(3)
  const out = forecast(students, each)

  return (
    <div className="site__calc">
      <div className="site__calc-in">
        <label>
          <span>Students taking part</span>
          <input
            className="input"
            type="number"
            min={0}
            max={100000}
            value={students}
            onChange={(e) => setStudents(Number(e.target.value))}
          />
        </label>
        <label>
          <span>Items each</span>
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            value={each}
            onChange={(e) => setEach(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="site__calc-out">
        <div>
          <b>
            <CountUp value={out.items} format={(n) => Math.round(n).toLocaleString()} />
          </b>
          <span>objects kept in use</span>
        </div>
        <div>
          <b>
            <CountUp value={out.kg} format={kgLabel} />
          </b>
          <span>kept out of the landfill</span>
        </div>
        <div>
          <b>
            <CountUp value={out.co2e} format={co2eLabel} />
          </b>
          <span>production avoided</span>
        </div>
      </div>
      <p className="site__calc-note">
        Using the published factor table, an assumed move-out category mix (weighted toward small things, not toward
        bikes and laptops) and a displacement rate of {DISPLACEMENT}. A forecast, not a claim: the app itself only ever
        reports what two people confirmed.
      </p>
    </div>
  )
}

export function Landing() {
  return (
    <div className="site">
      <SiteNav />

      <section className="site__hero">
        <div className="site__wrap">
          <div className="site__kicker">Campus circular economy · Any university, one Marketplace each</div>
          <h1>BetterBarter</h1>
          <p className="site__lede">
            Keep the things your campus already owns in use — and count every object that stayed out of the landfill.
          </p>
          <div className="site__cta-row">
            <a className="site__cta" href={APP}>
              Continue with school email <ArrowRight size={19} strokeWidth={2.4} />
            </a>
            <a className="site__cta site__cta--ghost" href="#impact">
              See how we count it
            </a>
          </div>
          <p className="site__hero-note">
            Every May a working desk lamp goes into a dumpster because the person two floors down never knew it existed.
            A campus is the densest reuse market in a city — and the only one where the buyer, the seller and the object
            are already inside the same building.
          </p>
        </div>
      </section>

      <section className="site__section">
        <Reveal>
        <div className="site__wrap">
          <div className="site__kicker">The problem</div>
          <h2>Reuse fails on friction, not on willingness.</h2>
          <p className="site__section-lede">
            Students do not throw out working things because they want to. They throw them out because listing an item
            takes longer than carrying it to the bin, and because the alternative is meeting a stranger off campus. The
            waste is downstream of a user-experience problem.
          </p>
          <div className="site__stats">
            {PROBLEM.map(([big, unit, line]) => (
              <div key={big} className="site__stat">
                <b>
                  {big} <i>{unit}</i>
                </b>
                <span>{line}</span>
              </div>
            ))}
          </div>
          <h3 className="site__sub">The shape of a university year</h3>
          <p className="site__fine" style={{ marginBottom: 4 }}>
            Disposal and buying are the same curve, eight weeks apart, twice a year. Schematic rather than measured —
            nobody has per-week discard data for a campus, because the thing that would produce it is the Marketplace itself.
          </p>
          <Seasonality />

          <p className="site__fine" style={{ marginTop: 22 }}>
            US figures for 2018 from the EPA, linked in full under the method below. A single move-out week compresses a
            year of that curve into seven days on one campus.
          </p>
        </div>
        </Reveal>
      </section>

      <section className="site__section" id="how">
        <Reveal>
        <div className="site__wrap">
          <div className="site__kicker">How a handoff happens</div>
          <h2>Four steps, and the last one is what makes it measurable.</h2>
          <div className="site__steps">
            {STEPS.map(([n, title, body], i) => {
              const Icon = STEP_ICONS[i]
              return (
              <div key={n} className="site__step">
                <div className="site__step-n">
                  <Icon size={22} strokeWidth={1.9} />
                  <span>{n}</span>
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
              )
            })}
          </div>
          <div className="site__segs">
            {SEGMENTS.map(([name, line]) => (
              <div key={name} className="site__seg">
                <b>{name}</b>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      <section className="site__section" id="impact">
        <Reveal>
        <div className="site__wrap">
          <div className="site__kicker">The method · model v{MODEL_VERSION}</div>
          <h2>We count objects first, carbon second, and say which is which.</h2>
          <p className="site__section-lede">
            Most reuse claims are a weight divided by an assumption. Ours is built from a single verifiable event — two
            students both confirming that one object changed hands — and every conversion after that is published, in
            the open, at the low end of its range.
          </p>

          <h3 className="site__sub" style={{ marginTop: 0 }}>Where this sits in the hierarchy</h3>
          <p className="site__fine" style={{ marginBottom: 4 }}>
            Campus sustainability work mostly happens two rungs down — bins, audits, hauling contracts. Reuse is the top
            rung because nothing is reprocessed and nothing is driven anywhere; the object simply keeps being the object.
          </p>
          <Hierarchy />

          <h3 className="site__sub">How the number is built</h3>
          <div className="site__levels">
            <div className="site__level">
              <div className="site__level-tag">Level 1 · Measured</div>
              <b>Confirmed handoffs</b>
              <span>
                Both people tapped “handed off” in the thread. One object, two verified students, one timestamp. This is
                the only number we state without a qualifier.
              </span>
            </div>
            <div className="site__level">
              <div className="site__level-tag">Level 2 · Estimated</div>
              <b>Mass kept in use</b>
              <span>
                Item count × a typical mass for its category. Ordinary dorm objects at ordinary weights, never the
                heaviest thing the category could hold.
              </span>
            </div>
            <div className="site__level">
              <div className="site__level-tag">Level 3 · Conservative</div>
              <b>Production avoided</b>
              <span>
                Mass × a low-end cradle-to-gate factor × a displacement rate of {DISPLACEMENT}, because a reused object
                only avoids manufacturing if it stops a purchase. <b>Renting earns nothing here</b> — the object goes
                back, so we count the loan and claim no carbon for it.
              </span>
            </div>
          </div>

          <h3 className="site__sub">The factor table, in full</h3>
          <table className="site__factors">
            <thead>
              <tr>
                <th>Category</th>
                <th>Typical mass</th>
                <th>kg CO₂e / kg</th>
                <th>Basis</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(FACTORS).map(([cat, f]) => (
                <tr key={cat}>
                  <td>{cat}</td>
                  <td>{f.kg} kg</td>
                  <td>{f.efPerKg.toFixed(1)}</td>
                  <td>{f.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="site__fine">
            Defaults for a first campus, not measurements of your object — a poster who knows the real weight can correct
            it, like every other parsed field. The table lives in one file in the public repository, so any number here
            can be checked, argued with, or replaced.
          </p>

          <h3 className="site__sub">The mix a forecast assumes</h3>
          <p className="site__fine" style={{ marginBottom: 16 }}>
            A move-out hallway is mostly small things. Weighting the forecast this way rather than averaging the table
            flat keeps the estimate off the back of the two emissions-dense categories — it lowers our own number by
            roughly a third, which is the direction an honest assumption should move it.
          </p>
          <MixBar />

          <h3 className="site__sub">The same hundred handoffs, measured twice</h3>
          <p className="site__fine" style={{ marginBottom: 18 }}>
            Weight and carbon do not rank the same categories, which is exactly why we publish both and lead with
            neither. Hover a bar for the arithmetic behind it.
          </p>
          <HundredHandoffs />

          <h3 className="site__sub">What a floor, a building or a class year moves</h3>
          <Estimator />

          <h3 className="site__sub">And at the scale above that</h3>
          <p className="site__fine" style={{ marginBottom: 16 }}>
            The same arithmetic, multiplied. There are <b>15.4 million undergraduates</b> in the United States, and every
            one of them moves in and out of somewhere — so the ceiling on this is not demand, it is how many campuses
            have a board dense enough to be worth opening.
          </p>
          <ScaleLadder />

          <h3 className="site__sub">Sources</h3>
          <ul className="site__sources">
            {SOURCES.map((s) => (
              <li key={s.url}>
                {s.claim}{' '}
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.source}
                </a>
              </li>
            ))}
          </ul>
        </div>
        </Reveal>
      </section>

      <section className="site__section">
        <Reveal>
        <div className="site__wrap">
          <div className="site__kicker">Why a board, and not another donation drive</div>
          <h2>Reuse dies on logistics. A campus does not need any.</h2>
          <div className="site__grid">
            {WHY.map(([title, body], i) => {
              const Icon = WHY_ICONS[i % WHY_ICONS.length]
              return (
              <div key={title} className="site__cell">
                <b>
                  <Icon size={17} strokeWidth={1.9} />
                  {title}
                </b>
                <span>{body}</span>
              </div>
              )
            })}
          </div>
        </div>
        </Reveal>
      </section>

      <section className="site__section" id="safety">
        <Reveal>
        <div className="site__wrap">
          <div className="site__kicker">Safety and the rules</div>
          <h2>{RULES_SUMMARY}</h2>
          <div className="site__split" style={{ marginTop: 32 }}>
            <div>
              <div className="site__rules">
                {RULES.map((r) => (
                  <div key={r.title} className="site__rule">
                    <Check size={17} strokeWidth={2.6} />
                    <span>{r.title}</span>
                  </div>
                ))}
              </div>
              <p className="site__fine" style={{ marginTop: 14 }}>
                Every account agrees to the full text once, before it can reach the Marketplace.
              </p>
            </div>
            <div className="site__panel">
              <h4>What happens when something goes wrong</h4>
              <p>
                Report an account and it disappears from your board immediately, then gets reviewed. Listings that break
                the rules are removed; accounts that break them lose posting and claiming.
              </p>
              <p>
                Anything illegal is a matter for Public Safety or the police, not for us — and BetterBarter keeps the
                conversation so there is a record of what was agreed.
              </p>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      <section className="site__section" id="money">
        <Reveal>
        <div className="site__wrap">
          <div className="site__kicker">How this pays for itself</div>
          <h2>Charged before a deal exists, never on the object.</h2>
          <p className="site__section-lede">
            A board that takes a cut of a give-away is not a reuse product, it is a tax on generosity. So the money
            never sits on the handoff itself — it sits on the two things that are worth paying for once a campus Marketplace
            is busy.
          </p>
          <div className="site__grid">
            <div className="site__cell">
              <b>Campus licence — the main line</b>
              <span>
                Housing and sustainability offices already pay to haul this material away and already have to report
                circularity. A licensed campus gets the admin tools, the move-out programme and an audited,
                object-level number they cannot produce today. That is a budget that exists, spent against a cost that
                exists.
              </span>
            </div>
            <div className="site__cell">
              <b>Verified-audience placements</b>
              <span>
                Movers, storage, print shops, student services — businesses that want to reach one specific campus at
                one specific fortnight of the year. Paid up front, clearly marked, and never mixed into the Marketplace’s
                ranking.
              </span>
            </div>
            <div className="site__cell">
              <b>What stays free, permanently</b>
              <span>
                Posting, claiming, giving away, renting and swapping. No listing fee, no fee per handoff, no cut of a
                sale settled between two students, and no charge to a student for anything on the object path.
              </span>
            </div>
            <div className="site__cell">
              <b>If payments are ever added</b>
              <span>
                Only as an option on paid items, for people who want the receipt — and a fee only on that path. A
                give-away with a transaction fee attached would defeat the entire product, so that line is not one we
                will cross.
              </span>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      <section className="site__section">
        <Reveal>
        <div className="site__wrap">
          <div className="site__kicker">What BetterBarter is not</div>
          <h2>The things left off the Marketplace, on purpose.</h2>
          <table className="site__not">
            <tbody>
              {NOT.map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Reveal>
      </section>

      <section className="site__section">
        <Reveal>
        <div className="site__wrap">
          <div className="site__kicker">Questions</div>
          <h2>The ones worth answering before you sign in.</h2>
          <dl className="site__faq">
            {FAQ.map(([q, a]) => (
              <div key={q} className="site__q">
                <dt>{q}</dt>
                <dd>{a}</dd>
              </div>
            ))}
          </dl>
        </div>
        </Reveal>
      </section>

      <section className="site__close">
        <div className="site__wrap">
          <h2>The greenest object on campus is the one already here.</h2>
          <p>
            One photo and one sentence puts it back into use, and one confirmation from each side puts it on the record.
            Sign in with the university address you already have.
          </p>
          <div className="site__cta-row">
            <a className="site__cta" href={APP}>
              Open the Marketplace <ArrowRight size={19} strokeWidth={2.4} />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
