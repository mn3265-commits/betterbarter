import { ArrowRight, Check } from 'lucide-react'
import { RULES, RULES_SUMMARY } from '../lib/rules'
import '../styles/site.css'

/**
 * The public front door at `/`. The product itself lives at `/app`; this page
 * exists so a link to Handoff can be sent to someone who has never heard of it
 * and still explains itself — what the board is, who is allowed on it, how a
 * handoff actually happens, and what the app deliberately does not do.
 *
 * Same design system as the app (tokens.css): zero radius, flush left, 2px
 * rules, one accent red. Copy is the app's own voice, not marketing language.
 */

const APP = '/app'

const SEGMENTS: [string, string][] = [
  ['Free', 'The thing you would otherwise leave in a hallway. Someone on your floor takes it today.'],
  ['For sale', 'Cheap, and settled between the two of you. The app never touches the money.'],
  ['Wanted', 'The board in reverse: say what you need, and let the person holding it find you.'],
]

const STEPS: [string, string, string][] = [
  [
    '01',
    'Post it in about twenty seconds',
    'One photo where the thing stands, then a sentence written the way you would text a friend. The app reads the price, category, condition and meetup spot out of your own words — there is no form, and any of it can be corrected in one tap.',
  ],
  [
    '02',
    'Claim what you want, nearest first',
    'The board only ever shows your campus, closest halls first. Free things are free — take them. Priced things are cheap and arranged between you two.',
  ],
  [
    '03',
    'Meet somewhere public',
    'Claiming opens a conversation with the meetup already written into it, and holds the item for three hours. A lobby, a front desk, a dining entrance — somewhere other people are. Never a room number, yours or theirs.',
  ],
  [
    '04',
    'Both of you confirm it happened',
    'When the thing changes hands, you both tap "handed off". That adds +1 to each of your public handoff counts — the whole reputation system, and the only number this product runs on.',
  ],
]

const DIFFERENT: [string, string][] = [
  [
    'A school email is the whole door',
    'One verified school email per account, re-checked every term. Everyone on the board goes to your school, and you never see another campus.',
  ],
  [
    'A paragraph, not a form',
    'Nobody fills in eight fields to give away a lamp. Write the sentence; the app shows you what it understood and lets you fix any of it in one tap.',
  ],
  [
    'Spot rules, not a spot list',
    'The app never claims to know your campus. It gives you the rule — public, populated, never a room — and the spots students actually use build themselves out of real handoffs.',
  ],
  [
    'A handoff count, not stars',
    'No five-star theatre. One public number that only goes up when both people confirm a real handoff, so it cannot be farmed by talking.',
  ],
  [
    'A board that cleans itself',
    'On day seven the app asks whether the thing is still there. Silence pauses the listing. A board full of things that already left is a dead board.',
  ],
  [
    'Move-out mode',
    'May is the whole business. Turn it on when you are clearing a room and everything you post goes out as a batch that ends on the day you leave.',
  ],
]

const NOT: [string, string][] = [
  ['Not trading', 'Two people rarely want each other’s thing. Money already solved this.'],
  ['Not renting', 'Deposits, damage, disputes — a second app hiding inside the first.'],
  ['No fee per deal', 'The handoff happens in a lobby, on Venmo. We cannot see it, so we do not charge it.'],
  ['Not every campus', 'One school at a time. All of Columbia first, dense before wide.'],
]

const FAQ: [string, string][] = [
  [
    'Who can sign in?',
    'Anyone with a working @columbia.edu address, and nobody else. Sign-up checks the email domain server-side, so an account on a campus we do not run yet cannot get onto the board at all.',
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
    'Nothing dangerous or illegal: weapons, drugs and prescriptions, alcohol and vapes, IDs and keys, stolen or university-owned property, coursework meant to be handed in. The app checks a listing before it posts and tells you why.',
  ],
  [
    'Is my stuff visible to the whole internet?',
    'No. The board is readable only by signed-in accounts on your own campus — enforced in the database, not by hiding a link.',
  ],
  [
    'When do other schools get it?',
    'When Columbia is dense enough to be useful on a Tuesday, not just in May. Adding a campus is one database row; adding it early is how boards die empty.',
  ],
]

export function Landing() {
  return (
    <div className="site">
      <header className="site__bar">
        <div className="site__wrap site__bar-in">
          <div className="site__mark">HANDOFF</div>
          <span className="tag tag-outline">Columbia trial</span>
          <a className="site__bar-link" href="#how">
            How it works
          </a>
          <a className="site__bar-link" href="#safety">
            Safety
          </a>
          <a className="btn btn-primary" href={APP}>
            Open the board
          </a>
        </div>
      </header>

      <section className="site__hero">
        <div className="site__wrap">
          <div className="site__kicker">V1 · Trialing at Columbia</div>
          <h1>
            HAND
            <br />
            OFF
          </h1>
          <p className="site__lede">
            Give it away or sell it to someone else on campus. One school, one board, no shipping and no strangers.
          </p>
          <div className="site__cta-row">
            <a className="site__cta" href={APP}>
              Continue with school email <ArrowRight size={19} strokeWidth={2.4} />
            </a>
            <a className="site__cta site__cta--ghost" href="#how">
              See how it works
            </a>
          </div>
          <p className="site__hero-note">
            Every May a working desk lamp goes into a dumpster because the person two floors down never knew it existed.
            That is the entire problem this board solves.
          </p>
        </div>
      </section>

      <section className="site__section">
        <div className="site__wrap">
          <div className="site__kicker">One board, three ways to use it</div>
          <h2>Post what you are done with. Take what you need.</h2>
          <div className="site__segs">
            {SEGMENTS.map(([name, line]) => (
              <div key={name} className="site__seg">
                <b>{name}</b>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site__section" id="how">
        <div className="site__wrap">
          <div className="site__kicker">How it works</div>
          <h2>Four steps, and the last one is the point.</h2>
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
        </div>
      </section>

      <section className="site__section">
        <div className="site__wrap">
          <div className="site__kicker">What is different</div>
          <h2>Built for a hallway, not a marketplace.</h2>
          <p className="site__section-lede">
            The handoff itself happens between two people standing in a lobby. No app is there for that, so everything
            here is designed around the parts an app can actually control: who gets in, what may be listed, where people
            meet, and whether the thing really changed hands.
          </p>
          <div className="site__grid">
            {DIFFERENT.map(([title, body]) => (
              <div key={title} className="site__cell">
                <b>{title}</b>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site__section" id="safety">
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
              <p style={{ fontSize: 13.5, opacity: 0.65, margin: '14px 0 0' }}>
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
      </section>

      <section className="site__section">
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
      </section>

      <section className="site__section">
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
      </section>

      <section className="site__close">
        <div className="site__wrap">
          <h2>Move-out is the busiest week of the year. Start before it.</h2>
          <p>
            One photo and one sentence puts something on your campus board. Sign in with the Columbia address you
            already have.
          </p>
          <div className="site__cta-row">
            <a className="site__cta" href={APP}>
              Open the board <ArrowRight size={19} strokeWidth={2.4} />
            </a>
          </div>
        </div>
      </section>

      <footer className="site__wrap site__foot">
        <span>Handoff — campus give-away &amp; resale board · v1, trialing at Columbia.</span>
        <a href={APP}>Open the board</a>
        <a href="/?showcase">Design walkthrough</a>
        <a href="https://github.com/mn3265-commits/handoff">Source</a>
      </footer>
    </div>
  )
}
