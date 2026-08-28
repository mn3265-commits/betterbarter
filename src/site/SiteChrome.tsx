import { DISPLACEMENT, MODEL_VERSION } from '../lib/impact'
import { LoopMark } from './LoopMark'

/**
 * The site's header and footer, in one place.
 *
 * They were written twice — once on the landing page, once on About — and had
 * already drifted: About was missing Safety and had no link back to itself,
 * and the two footers listed different things. Same lesson as the app's chrome:
 * a nav that exists in two files is a nav that will disagree with itself.
 */

const NAV: [string, string, string][] = [
  ['how', '/#how', 'How it works'],
  ['impact', '/#impact', 'Impact'],
  ['safety', '/#safety', 'Safety'],
  ['about', '/about', 'About'],
  ['deck', '/deck', 'Deck'],
]

export function SiteNav({ current }: { current?: string }) {
  return (
    <header className="site__bar">
      <div className="site__wrap site__bar-in">
        <a className="site__mark" href="/" style={{ textDecoration: 'none' }}>
          <LoopMark size={21} />
          BetterBarter
        </a>
        <span className="tag tag-outline">Circular economy · For universities</span>
        {NAV.map(([key, href, label]) => (
          <a key={key} className={'site__bar-link' + (current === key ? ' is-here' : '')} href={href}>
            {label}
          </a>
        ))}
        <a className="btn btn-primary" href="/app">
          Open the board
        </a>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site__wrap site__foot">
      <span>
        BetterBarter — campus reuse, counted · Any university, one board each · Built by Agung Nugroho and Tessa Wong ·
        impact model v{MODEL_VERSION}, displacement {DISPLACEMENT}.
      </span>
      <a href="/about">About</a>
      <a href="/deck">Pitch deck</a>
      <a href="/brand">Brand guide</a>
      <a href="/app">Open the board</a>
      <a href="/?showcase">Design walkthrough</a>
      <a href="https://github.com/mn3265-commits/handoff">Source &amp; model</a>
    </footer>
  )
}
