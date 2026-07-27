import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Handoff } from '../lib/useHandoff'

const CHIPS = ['On my way', 'Can I come at 7?', 'Still available?']

/** Chat (thread): finish the arrangement, with the meetup already written down. */
export function Chat({ h }: { h: Handoff }) {
  const t = h.activeThread
  const fallback = h.item(h.selId)
  const name = t?.otherName ?? fallback.seller
  const handoffs = t?.otherHandoffs ?? fallback.handoffs
  const spot = t?.spotName ?? h.spotLabel()
  const window_ = t?.pickupWindow ?? h.win

  return (
    <div className="screen">
      <div
        style={{
          padding: '58px 16px 10px',
          borderBottom: '2px solid var(--color-divider)',
          display: 'flex',
          alignItems: 'center',
          gap: 11,
        }}
      >
        <button
          onClick={h.jumpChats}
          style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--color-text)' }}
        >
          <ArrowLeft size={19} strokeWidth={2.2} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15 }}>{name}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>{handoffs} handoffs · verified school email</div>
        </div>
        <button
          onClick={() => h.flash('Reported. This account is hidden from you and flagged for review.')}
          className="btn btn-ghost"
          style={{ fontSize: 12 }}
        >
          Block
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* pinned handoff card */}
        <div style={{ border: '2px solid var(--color-text)', padding: '11px 12px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>
            Handoff scheduled
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, marginTop: 4 }}>{spot}</div>
          <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 2 }}>
            {window_} · held for 3 hours
            {t?.listingTitle ? ` · ${t.listingTitle}` : ''}
          </div>
        </div>

        {h.msgs.map((m) => (
          <div key={m.id} style={{ display: 'flex' }}>
            {m.who === 'me' ? (
              <div
                style={{
                  marginLeft: 'auto',
                  maxWidth: '76%',
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                  padding: '10px 12px',
                  fontSize: 14,
                  lineHeight: 1.35,
                }}
              >
                {m.text}
              </div>
            ) : (
              <div
                style={{
                  maxWidth: '76%',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-divider)',
                  padding: '10px 12px',
                  fontSize: 14,
                  lineHeight: 1.35,
                }}
              >
                {m.text}
              </div>
            )}
          </div>
        ))}

        {h.live && h.msgs.length <= 1 && (
          <div style={{ fontSize: 11.5, opacity: 0.55, textWrap: 'pretty' }}>
            {name.split(' ')[0]} gets this on their board. Replies show up here the moment they send one.
          </div>
        )}
      </div>

      {/* quick-reply chips */}
      <div style={{ borderTop: '2px solid var(--color-divider)', padding: '10px 16px 0', display: 'flex', gap: 7, overflowX: 'auto' }}>
        {CHIPS.map((c) => (
          <button key={c} onClick={() => h.sendText(c)} className="btn btn-secondary" style={{ flex: 'none', fontSize: 12.5, fontWeight: 500 }}>
            {c}
          </button>
        ))}
      </div>

      {/* composer */}
      <div style={{ padding: '10px 16px 40px', display: 'flex', gap: 9, alignItems: 'center' }}>
        <input
          className="input"
          placeholder="Message"
          value={h.draftMsg}
          onChange={(e) => h.setDraftMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') h.sendText(h.draftMsg)
          }}
        />
        <button
          onClick={() => h.sendText(h.draftMsg)}
          style={{
            flex: 'none',
            border: 0,
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            width: 44,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ArrowRight size={19} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
