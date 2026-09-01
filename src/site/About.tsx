import { ArrowRight } from 'lucide-react'
import { SiteFooter, SiteNav } from './SiteChrome'
import '../styles/site.css'

/**
 * `/about` — who is behind BetterBarter and what it is ultimately for.
 *
 * The vision is a self-sufficient community that cares about people and planet,
 * and the page is written to earn that sentence rather than assert it: what
 * self-sufficient means concretely on a campus, why people and planet are the
 * same problem here rather than two, and what would have to be true for the
 * claim to be false.
 */

const APP = '/app'

const PRINCIPLES: [string, string, string][] = [
  [
    '01',
    'A community should be able to supply itself',
    'A residential campus already owns almost everything its next intake needs to buy. The lamp exists, the fridge exists, the drill exists — they are two floors away, invisible. Self-sufficiency here is not austerity or off-grid living; it is a community noticing what it already has before it orders more.',
  ],
  [
    '02',
    'People and planet are the same problem on a campus',
    'The student who cannot afford a $200 furnishing run and the object heading for a dumpster are two halves of one transaction that never happened. Solve it for the person and the emissions follow; solve it for the emissions alone and you get a donation bin nobody uses. We refuse to treat the two as a trade-off.',
  ],
  [
    '03',
    'Ownership is only one way to have a thing',
    'Free, sale, swap and rent are four answers to the same question — how do you get the use of an object without a new one being made. A drill rented by six people is five drills that were never manufactured, and the rental is over in a week.',
  ],
  [
    '04',
    'The community is the logistics',
    'Every reuse venture eventually meets the same wall: someone has to move the heavy thing, and a van erases the carbon saving it was built to create. A campus already contains the answer — a student with an hour, a trolley and a reason to want the work. Paid directly, counted publicly, and emitting nothing a walk across the quad does not.',
  ],
  [
    '05',
    'Trust is infrastructure, not a feature',
    'Reuse between strangers fails on fear, so the only wall we build is who gets in: one verified school email, one campus per Marketplace, a public count of real handoffs. Everything else — the rules, the public meetup spots, the record kept in the thread — exists so two people who have never met can hand something over without either of them being brave.',
  ],
  [
    '06',
    'Count it honestly or do not count it',
    'A circular claim that cannot be audited is marketing. We separate what was measured from what was estimated, publish the factors, take the low end of every range, and give away the assumption most likely to be challenged before anyone asks for it. A smaller number we can defend is worth more than a large one we cannot.',
  ],
]

const HORIZON: [string, string][] = [
  [
    'Now — one campus deep, not many campuses wide',
    'Any university email already opens its own Marketplace. Our own attention goes to a single school, building by building, until it is useful on an ordinary Tuesday and not only in the last week of May. Density is the whole product: a Marketplace with nothing on it is worse than none at all.',
  ],
  [
    'Next — the loop closes locally',
    'When renting and swapping carry as much traffic as giving away, a floor starts behaving like a small library of things. That is when the count stops being a waste metric and starts being a measure of how much a community can supply itself.',
  ],
  [
    'Later — the same primitive, every campus',
    'A school joins by someone signing in, not by us launching. What does not scale by copying is trust, so each campus starts the way the first one did: its own verified people, its own meetup spots, its own count, and its own name and mark on every profile.',
  ],
]

export function About() {
  return (
    <div className="site">
      <SiteNav current="about" />

      <section className="site__hero">
        <div className="site__wrap">
          <div className="site__kicker">About BetterBarter</div>
          <h1 className="site__about-h1">
            A self-sufficient
            <br />
            community that cares
            <br />
            about people and planet.
          </h1>
          <p className="site__lede" style={{ maxWidth: '38ch' }}>
            That is the whole vision, and it is smaller and more literal than it sounds: a place where the things people
            need are already here, and getting them from one person to the next costs nobody anything.
          </p>
        </div>
      </section>

      <section className="site__section">
        <div className="site__wrap">
          <div className="site__kicker">Where this came from</div>
          <h2>It started as a lamp in a dumpster.</h2>
          <div className="site__prose">
            <p>
              Every May, a residential campus throws out most of a year at once. Working fridges, desks, rugs, coats and
              textbooks go into the same skips, while eight weeks later the next intake buys the identical objects new —
              often the same students, in the other direction, financing it on money they do not have.
            </p>
            <p>
              Nobody in that picture wants the waste. The person carrying a lamp downstairs is not making an
              environmental choice; they are out of time, the truck is booked, and the alternative is arranging to meet a
              stranger from a marketplace app off campus. The waste is what is left over when the easy path and the
              right path are different paths.
            </p>
            <p>
              BetterBarter exists to make them the same path. One photo and one sentence, someone in your own building, an
              exchange in a lobby, and both of you confirming it happened. Everything else in the product — the
              verification, the three-hour hold, the day-seven check, the impact model — is scaffolding around that one
              moment.
            </p>
          </div>
        </div>
      </section>

      <section className="site__section" id="principles">
        <div className="site__wrap">
          <div className="site__kicker">What we believe</div>
          <h2>Five things this product refuses to be talked out of.</h2>
          <div className="site__steps">
            {PRINCIPLES.map(([n, title, body]) => (
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
          <div className="site__kicker">Where it goes</div>
          <h2>Dense before wide.</h2>
          <div className="site__grid">
            {HORIZON.map(([title, body]) => (
              <div key={title} className="site__cell">
                <b>{title}</b>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site__section">
        <div className="site__wrap">
          <div className="site__kicker">Who is building it</div>
          <h2>Two people, in the open.</h2>
          <div className="site__prose">
            <p>
              BetterBarter is built by <b>Agung Nugroho</b> and <b>Tessa Wong</b> at Columbia University — the product, the
              interface, the database and the impact model. Small enough to move at the speed of one conversation, and
              close enough to the problem to be its own first users: both of us have carried something down a stairwell
              in May knowing it still worked.
            </p>
            <p>
              Agung comes from customer lifecycle and growth, where the daily problem is the same one this product has:
              getting a very large number of ordinary people to complete one specific action, and measuring honestly
              whether they did.
            </p>
            <p>
              Campus reuse does not fail on technology. It fails on adoption and on trust, which are product and
              behaviour problems before they are engineering ones — and those are the problems this project was started
              to work on. The code and the factor table are public rather than described, so the claims can be checked
              by anyone who cares to.
            </p>
            <p>
              If you run housing, sustainability or a student group at a school where this should exist, or you want to
              argue with a number in the model,{' '}
              <a href="https://github.com/mn3265-commits/betterbarter">the repository</a> is the front door.
            </p>
          </div>
        </div>
      </section>

      <section className="site__close">
        <div className="site__wrap">
          <h2>The greenest object on campus is the one already here.</h2>
          <p>
            Give it, sell it, rent it, swap it — the only wrong answer is the dumpster. Sign in with the university
            address you already have.
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
