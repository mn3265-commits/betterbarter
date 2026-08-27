import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { RULES, RULES_SUMMARY } from '../lib/rules'
import {
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
import { LoopMark } from './LoopMark'
import { Reveal } from './Reveal'
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
  ['Free', 'The thing that would otherwise go in a hallway or a dumpster. Someone on your floor takes it today.'],
  ['For sale', 'Cheap, and settled between the two of you. The app never touches the money.'],
  ['Borrow', 'One drill can serve a whole floor. Lend it by the day or the week — it comes back to you.'],
  ['Swap', 'Your heater for their fan. Two objects stay in use, and neither of you buys anything.'],
  ['Wanted', 'The board in reverse: say what you need before you buy it new.'],
]

const PROBLEM: [string, string, string][] = [
  ['12.1M', 'tons', 'of furniture and furnishings thrown out in the US in one year — 80.1% of it landfilled.'],
  ['17M', 'tons', 'of textiles generated in the same year; 11.3M tons went straight to landfill.'],
  ['1 week', 'in May', 'is when a residential campus throws out most of its year — all at once, into the same dumpsters.'],
]

const STEPS: [string, string, string][] = [
  [
    '01',
    'Post it in about twenty seconds',
    'One photo where the thing stands, then a sentence written the way you would text a friend. The app reads the price, category, condition and meetup spot out of your own words. Nothing is thrown out because listing it felt like paperwork.',
  ],
  [
    '02',
    'Someone on your campus takes it on',
    'The board only ever shows your school, closest halls first. They can take it free, buy it cheap, borrow it for a week, or offer you something of theirs for it. The item is held for three hours so two people are not walking to the same lobby.',
  ],
  [
    '03',
    'You meet in a lobby, not a loading dock',
    'The exchange is two students and a doorway — no shipping, no packaging, no van, no warehouse. The lowest-carbon second life an object can have is the one that never leaves the building.',
  ],
  [
    '04',
    'Both of you confirm it happened',
    'That second tap is what turns an intention into a measured reuse event: one object, verified as kept in use, by two people who both said so. Every number on this page is built out of that one event.',
  ],
]

const WHY: [string, string][] = [
  [
    'Year-round, not one week in May',
    'Donation drives run when the trucks are booked. A board runs on the Tuesday you actually decide to get rid of the chair, which is when the decision to bin it is really made.',
  ],
  [
    'Peer-to-peer, so nothing is handled twice',
    'Collect, sort, store, resell is four touches and a vehicle. Floor to floor is one walk. Reuse loses its advantage the moment logistics get involved.',
  ],
  [
    'Counted at the object, not the truck',
    'Drives report weight after the fact, in aggregate. Handoff records one confirmed event per object, with its category — so the number is auditable from the bottom up.',
  ],
  [
    'Verified people, so reuse is not risky',
    'The reason students bin a working lamp instead of listing it is strangers. One verified school email per account, one campus per board, and a public handoff count.',
  ],
  [
    'It complements the drives, it does not replace them',
    'What the board cannot rehome still belongs in Give & Go Green and Clean + Go Green. The board removes the easy 80% from the pile so staffed collection can deal with the rest.',
  ],
  [
    'A board that cleans itself',
    'On day seven the app asks whether the thing is still there. Silence pauses the listing — a board full of things that already left is a dead board, and a dead board sends everything back to the dumpster.',
  ],
]

const NOT: [string, string][] = [
  ['Not a payments platform', 'No checkout, no escrow, no fee per deal. Money moves between two students the way it already does; we cannot see it, so we do not charge it.'],
  ['Not a deposit holder', 'Lending is a promise between two people on the same campus, not a contract we underwrite. We hold nothing and adjudicate nothing.'],
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
    'Why does borrowing not count toward the carbon number?',
    'Because the object comes back. A loan avoids a purchase for the person who borrowed it, but the owner still owns it, and nobody outside the two of them can say a purchase was truly prevented. So a rental is counted and reported as a reuse event, and earns no avoided-production credit at all — the assumption most likely to be challenged, given away before anyone asks.',
  ],
  [
    'Who is responsible if a borrowed thing breaks?',
    'The two of you. Handoff holds no deposit, no escrow and no insurance, and it will not decide who broke what — lend what you can afford to lose, agree the return date in the thread, and bring things back in the state you got them. That is in the community rules every account agrees to.',
  ],
  [
    'Does it cost anything?',
    'No. Free things are free, sold things are paid between the two of you however you already pay each other. Handoff takes no cut and holds no money.',
  ],
  [
    'Where do we actually meet?',
    'Somewhere public with other people around — a lobby, a front desk, a dining entrance, a library door. The app will not let a room number stand in for a meetup spot, and it does not publish where you live.',
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
  const shades = ['#0d422c', '#115538', '#176a44', '#1c7a4f', '#2f9463', '#4aa87a', '#6fb890', '#a9d3ba', '#cfe6d8']
  return (
    <div className="site__mix">
      <div className="site__mixbar">
        {rows.map(([cat, share], i) => (
          <div
            key={cat}
            className="site__mixbar-seg"
            style={{ width: share * 100 + '%', background: shades[i % shades.length] }}
            title={cat + ' · ' + Math.round(share * 100) + '%'}
          />
        ))}
      </div>
      <div className="site__mixkey">
        {rows.map(([cat, share], i) => (
          <div key={cat}>
            <i style={{ background: shades[i % shades.length] }} />
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
          <b>{out.items.toLocaleString()}</b>
          <span>objects kept in use</span>
        </div>
        <div>
          <b>{kgLabel(out.kg)}</b>
          <span>kept out of the landfill</span>
        </div>
        <div>
          <b>{co2eLabel(out.co2e)}</b>
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
      <header className="site__bar">
        <div className="site__wrap site__bar-in">
          <div className="site__mark">
            <LoopMark size={19} />
            Handoff
          </div>
          <span className="tag tag-outline">Circular economy · For universities</span>
          <a className="site__bar-link" href="#how">
            How it works
          </a>
          <a className="site__bar-link" href="#impact">
            Impact
          </a>
          <a className="site__bar-link" href="#safety">
            Safety
          </a>
          <a className="site__bar-link" href="/about">
            About
          </a>
          <a className="btn btn-primary" href={APP}>
            Open the board
          </a>
        </div>
      </header>

      <section className="site__hero">
        <div className="site__wrap">
          <div className="site__kicker">Campus circular economy · Any university, one board each</div>
          <h1>Handoff</h1>
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
          <p className="site__fine">
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
            {STEPS.map(([n, title, body]) => (
              <div key={n} className="site__step">
                <div className="site__step-n">{n}</div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
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
                only avoids manufacturing if it stops a purchase. <b>Borrowing earns nothing here</b> — the object goes
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
            {WHY.map(([title, body]) => (
              <div key={title} className="site__cell">
                <b>{title}</b>
                <span>{body}</span>
              </div>
            ))}
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
                Every account agrees to the full text once, before it can reach the board.
              </p>
            </div>
            <div className="site__panel">
              <h4>What happens when something goes wrong</h4>
              <p>
                Report an account and it disappears from your board immediately, then gets reviewed. Listings that break
                the rules are removed; accounts that break them lose posting and claiming.
              </p>
              <p>
                Anything illegal is a matter for Public Safety or the police, not for us — and Handoff keeps the
                conversation so there is a record of what was agreed.
              </p>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      <section className="site__section">
        <Reveal>
        <div className="site__wrap">
          <div className="site__kicker">What Handoff is not</div>
          <h2>The things left off the board, on purpose.</h2>
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
              Open the board <ArrowRight size={19} strokeWidth={2.4} />
            </a>
          </div>
        </div>
      </section>

      <footer className="site__wrap site__foot">
        <span>
          Handoff — campus reuse, counted · Any university, one board each · Built by Agung Nugroho and Tessa Wong ·
          impact model v{MODEL_VERSION}, displacement {DISPLACEMENT}.
        </span>
        <a href="/about">About</a>
        <a href={APP}>Open the board</a>
        <a href="/?showcase">Design walkthrough</a>
        <a href="https://github.com/mn3265-commits/handoff">Source &amp; model</a>
      </footer>
    </div>
  )
}
