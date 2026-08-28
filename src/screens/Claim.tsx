import { ArrowRight } from 'lucide-react'
import { SPOTS, WINDOWS } from '../data/seed'
import { AppBody, AppFooter, AppHeader } from '../components/Shell'
import type { SwapUp } from '../lib/useSwapUp'

/**
 * Claim / meetup (modal): agree on a public place without either person
 * revealing where they live. The app enforces a rule, not a curated list —
 * the named spots come from that campus's own accumulated handoffs.
 */
export function Claim({ h }: { h: SwapUp }) {
  const d0 = h.item(h.selId)
  const first = (d0.seller || 'them').split(' ')[0]
  const kind = h.kindOf(d0)
  const cta =
    kind === 'rent'
      ? 'Ask to borrow, and message ' + first
      : kind === 'trade'
        ? 'Offer a swap to ' + first
        : h.isFree(d0)
          ? 'Claim and message ' + first
          : 'Message ' + first
  const canSend = Boolean(h.spotName.trim() || h.spot) && !h.busy

  return (
    <div className="screen">
      <AppHeader
        kicker="Agree the meetup"
        title={kind === 'rent' ? 'Borrow it' : kind === 'trade' ? 'Offer a swap' : 'Claim it'}
        onBack={h.back}
      />

      <AppBody>
        <h3 style={{ fontSize: 26, margin: '0 0 8px', lineHeight: 1.1 }}>Where will you meet?</h3>
        <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 18px', textWrap: 'pretty' }}>
          We do not know your campus — you do. Pick the kind of place, then name it. The rule is the same everywhere:
          public, and never a room number.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-divider)', border: '1px solid var(--color-divider)' }}>
          {SPOTS.map((s) => (
            <label
              key={s.name}
              className="radio"
              style={{ background: 'var(--color-bg)', padding: 13, display: 'flex', alignItems: 'flex-start', gap: 11 }}
            >
              <input type="radio" name="hf-spot" checked={h.spot === s.name} onChange={() => h.setSpot(s.name)} />
              <span className="dot" style={{ marginTop: 3 }} />
              <span style={{ display: 'block' }}>
                <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15 }}>{s.name}</span>
                <span style={{ display: 'block', fontSize: 11.5, opacity: 0.62, marginTop: 2 }}>{s.why}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label>Name it, so you both find it</label>
          <input
            className="input"
            placeholder={d0.spot || 'The front desk'}
            value={h.spotName}
            onChange={(e) => h.setSpotName(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 14, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.6 }}>
          Used before on your campus
        </div>
        {h.campusSpots.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
            {h.campusSpots.map((cs) => (
              <button
                key={cs.name}
                onClick={() => h.setSpotName(cs.name)}
                className="btn btn-secondary"
                style={{ fontSize: 12.5, fontWeight: 500 }}
              >
                {cs.name} · {cs.uses}×
              </button>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.55, marginTop: 8 }}>Nothing yet — yours will be the first.</div>
        )}
        <p style={{ fontSize: 11.5, opacity: 0.6, margin: '9px 0 0', textWrap: 'pretty' }}>
          This list is built by students at your school, not by us. It starts empty and fills up after the first few
          handoffs.
        </p>

        <div style={{ marginTop: 20, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.6 }}>
          Pickup window
        </div>
        <div className="seg" style={{ marginTop: 8, width: '100%' }}>
          {WINDOWS.map((w) => (
            <label key={w} className="seg-opt" style={{ flex: 1, justifyContent: 'flex-start' }}>
              <input type="radio" name="hf-win" checked={h.win === w} onChange={() => h.setWin(w)} />
              <span>{w.replace('Today ', '').replace('Tomorrow ', 'Tmrw ').replace('Sunday ', 'Sun ')}</span>
            </label>
          ))}
        </div>

        <p style={{ fontSize: 11.5, opacity: 0.6, margin: '18px 0 0', textWrap: 'pretty' }}>
          Claiming holds the item for 3 hours. Two no-shows and you lose the ability to claim for a week.
        </p>
      </AppBody>

      <AppFooter>
        <button onClick={h.confirmClaim} disabled={!canSend} className="app-cta">
          <span>{h.busy ? 'Holding it…' : cta}</span>
          <ArrowRight size={20} strokeWidth={2} />
        </button>
      </AppFooter>
    </div>
  )
}
