import { ArrowLeft, Check } from 'lucide-react'
import { Photo } from '../components/Photo'
import type { Handoff } from '../lib/useHandoff'

/** Detail (a listing): decide whether to claim/ask, and see who you would meet. */
export function Detail({ h }: { h: Handoff }) {
  const d0 = h.item(h.selId)
  const isGone = h.gone.includes(d0.id)
  const mine = Boolean(d0.mine)
  const initials = d0.seller
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
  const days = h.daysOf(d0)
  const fresh =
    days >= 7
      ? 'Listed ' + days + ' days ago · the seller has not confirmed it this week'
      : 'Listed ' + d0.ago + (d0.ago === 'just now' ? '' : ' ago')
  const kind = h.kindOf(d0)
  const cta =
    kind === 'rent'
      ? 'Ask to borrow it — ' + h.priceOf(d0)
      : kind === 'trade'
        ? 'Offer a swap'
        : h.isFree(d0)
          ? 'Claim it'
          : 'Ask about it — ' + h.priceOf(d0)

  return (
    <div className="screen">
      <div
        style={{
          padding: '58px 16px 10px',
          borderBottom: '1px solid var(--color-divider)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          onClick={h.back}
          style={{
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 13,
            color: 'var(--color-text)',
          }}
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
          <span>Board</span>
        </button>
        {!mine && (
          <button
            onClick={() => h.flash('Reported. This account is hidden from you and flagged for review.')}
            className="btn btn-ghost"
            style={{ marginLeft: 'auto', fontSize: 12 }}
          >
            Report
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
        <Photo
          url={d0.photoUrl}
          caption={[d0.cat, d0.loc && `shot in ${d0.loc}`].filter(Boolean).join(' · ')}
          height={238}
          hatch="hatch-lg"
          border="0"
        />
        <div style={{ borderBottom: '1px solid var(--color-divider)' }} />
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 30, letterSpacing: '-.02em', color: 'var(--color-accent-700)' }}>
              {h.priceOf(d0)}
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, marginLeft: 'auto' }}>
              {d0.ago}
              {d0.ago === 'just now' ? '' : ' ago'}
            </div>
          </div>
          <h3 style={{ fontSize: 23, margin: '6px 0 10px', lineHeight: 1.12 }}>{d0.title}</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="tag tag-neutral">{d0.cond}</span>
            <span className="tag tag-neutral">{d0.cat}</span>
            {d0.loc && <span className="tag tag-outline">{d0.loc}</span>}
          </div>
          <hr className="hr" />
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 44,
                height: 44,
                flex: 'none',
                background: 'var(--color-neutral-300)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 16,
                color: 'var(--color-neutral-800)',
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15 }}>
                {mine ? 'You' : d0.seller}
              </div>
              <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 1 }}>
                {d0.handoffs} handoffs{d0.since ? ` · joined ${d0.since}` : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 11, color: 'var(--color-accent-700)' }}>
                <Check size={13} strokeWidth={2.4} />
                <span>Verified school email</span>
              </div>
            </div>
          </div>
          <hr className="hr" />
          {d0.desc && <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: 0, textWrap: 'pretty' }}>{d0.desc}</p>}
          <div style={{ marginTop: 18, border: '1px solid var(--color-divider)', padding: '12px 13px' }}>
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.6 }}>Hands off at</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, marginTop: 4 }}>{d0.spot}</div>
            <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 2 }}>
              Named by the seller, public, and never a room number.
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 8, borderTop: '1px solid var(--color-divider)', paddingTop: 7 }}>
              {fresh}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--color-divider)',
          padding: '12px 16px 40px',
          display: 'flex',
          gap: 10,
          background: 'var(--color-bg)',
        }}
      >
        {isGone ? (
          <div style={{ flex: 1, padding: '14px 0', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, opacity: 0.5 }}>
            Already gone — try a saved search
          </div>
        ) : mine ? (
          <>
            <div style={{ flex: 1, padding: '14px 0', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, opacity: 0.55 }}>
              Your listing
            </div>
            <button onClick={h.jumpMe} className="btn btn-secondary" style={{ flex: 'none', padding: '15px 14px' }}>
              Manage
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => h.go('claim')}
              disabled={h.busy}
              style={{
                flex: 1,
                border: 0,
                background: 'var(--color-accent)',
                color: 'var(--color-bg)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 15,
                padding: '15px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                opacity: h.busy ? 0.6 : 1,
              }}
            >
              {cta}
            </button>
            <button
              onClick={() => h.flash('Saved. We will ping you if the price drops.')}
              className="btn btn-secondary"
              style={{ flex: 'none', padding: '15px 14px' }}
            >
              Save
            </button>
          </>
        )}
      </div>
    </div>
  )
}
