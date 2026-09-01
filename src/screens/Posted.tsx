import type { Barter } from '../lib/useBarter'

/** Posted (confirmation). Full-bleed accent field, same construction as the Gate. */
export function Posted({ h }: { h: Barter }) {
  return (
    <div
      className="screen"
      style={{ background: 'var(--color-accent)', color: 'var(--color-on-accent)', padding: '74px 26px 46px' }}
    >
      <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', opacity: 0.85 }}>{`Live at ${h.campusName || 'your campus'}`}</div>
      <div style={{ height: 2, background: 'var(--color-bg)', opacity: 0.5, margin: '14px 0 22px' }} />
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 44, lineHeight: 0.98, letterSpacing: '-.025em' }}>
        {h.postedTitle}
      </div>
      <p style={{ fontSize: 17, lineHeight: 1.35, margin: '20px 0 0', maxWidth: '24ch' }}>{h.postedNote}</p>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* The $2 bump is off — Tessa, 31 Aug: it needs many more listings
            before bumping means anything, and if it comes back it belongs in
            step 2 of posting, not on the screen that says well done. */}
        <button
          onClick={h.jumpBrowse}
          style={{
            border: 0,
            background: 'var(--color-bg)',
            color: 'var(--color-accent-800)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 15,
            padding: '15px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          It is on the Marketplace now
        </button>
        <button
          onClick={h.startPost}
          style={{
            border: '1.5px solid var(--color-on-accent)', borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: 'var(--color-on-accent)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 15,
            padding: '13px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Post the Next Item
        </button>
      </div>
    </div>
  )
}
