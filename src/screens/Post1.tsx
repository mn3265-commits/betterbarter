import { Camera } from 'lucide-react'
import type { Handoff } from '../lib/useHandoff'

/** Post, step 1 — photo (modal). Get the photo in one tap. */
export function Post1({ h }: { h: Handoff }) {
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
          onClick={h.jumpBrowse}
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
          Photo first · step 1 of 2
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px' }}>
        {!h.photo ? (
          <button
            onClick={h.shoot}
            style={{
              width: '100%',
              height: 300,
              border: '2px dashed var(--color-divider)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              padding: 16,
              gap: 8,
              color: 'var(--color-text)',
            }}
          >
            <Camera size={30} strokeWidth={1.7} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20 }}>Shoot it where it stands</span>
            <span style={{ fontSize: 12.5, opacity: 0.65 }}>One photo is enough. Median post takes 21 seconds.</span>
          </button>
        ) : (
          <>
            <div className="hatch-lg" style={{ height: 300, border: '1px solid var(--color-divider)', display: 'flex', alignItems: 'flex-end', padding: 12 }}>
              <span style={{ fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>
                Photo · shot in Carman 6
              </span>
            </div>
            <div style={{ marginTop: 16, fontSize: 12.5, opacity: 0.65, textWrap: 'pretty' }}>
              That is the only photo you need. Next you write one paragraph and the app fills in the rest.
            </div>
          </>
        )}
      </div>

      <div style={{ borderTop: '2px solid var(--color-divider)', padding: '12px 16px 40px', background: 'var(--color-bg)' }}>
        <button
          onClick={h.toStep2}
          disabled={!h.photo}
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
            cursor: h.photo ? 'pointer' : 'not-allowed',
            opacity: h.photo ? 1 : 0.45,
          }}
        >
          Next — say what it is
        </button>
      </div>
    </div>
  )
}
