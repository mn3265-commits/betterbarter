import { ArrowRight } from 'lucide-react'
import { CAMPUS_SPOTS, SPOTS, WINDOWS } from '../data/seed'
import type { Handoff } from '../lib/useHandoff'

/**
 * Claim / meetup (modal): agree on a public place without either person
 * revealing where they live. The app enforces a rule, not a curated list.
 */
export function Claim({ h }: { h: Handoff }) {
  const d0 = h.item(h.selId)
  const first = d0.seller.split(' ')[0]
  const cta = h.isFree(d0) ? 'Claim and message ' + first : 'Message ' + first

  return (
    <div className="screen">
      <div
        style={{
          padding: '58px 16px 10px',
          borderBottom: '2px solid var(--color-divider)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <button
          onClick={h.back}
          style={{
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 13,
            color: 'var(--color-text)',
          }}
        >
          Cancel
        </button>
        <div style={{ marginLeft: 'auto', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.6 }}>
          Step 1 of 1
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 20px' }}>
        <h3 style={{ fontSize: 26, margin: '0 0 8px', lineHeight: 1.1 }}>Where will you meet?</h3>
        <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 18px', textWrap: 'pretty' }}>
          We do not know your campus — you do. Pick the kind of place, then name it. The rule is the same everywhere:
          public, and never a room number.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-divider)', border: '2px solid var(--color-divider)' }}>
          {SPOTS.map((s) => (
            <label
              key={s.name}
              className="radio"
              style={{ background: 'var(--color-bg)', padding: 13, display: 'flex', alignItems: 'flex-start', gap: 11 }}
            >
              <input type="radio" name="hf-spot" checked={h.spot === s.name} onChange={() => h.setSpot(s.name)} />
              <span className="dot" style={{ marginTop: 3 }} />
              <span style={{ display: 'block' }}>
                <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15 }}>{s.name}</span>
                <span style={{ display: 'block', fontSize: 11.5, opacity: 0.62, marginTop: 2 }}>{s.why}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label>Name it, so you both find it</label>
          <input className="input" placeholder="Carman front desk" value={h.spotName} onChange={(e) => h.setSpotName(e.target.value)} />
        </div>

        <div style={{ marginTop: 14, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.6 }}>
          Used before on your campus
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
          {CAMPUS_SPOTS.map((cs) => (
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
      </div>

      <div style={{ borderTop: '2px solid var(--color-divider)', padding: '12px 16px 40px', background: 'var(--color-bg)' }}>
        <button
          onClick={h.confirmClaim}
          style={{
            width: '100%',
            border: 0,
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 15,
            padding: '15px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{cta}</span>
          <ArrowRight size={20} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
