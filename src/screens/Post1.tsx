import { useRef } from 'react'
import { Camera } from 'lucide-react'
import type { Handoff } from '../lib/useHandoff'

/** Post, step 1 — photo. Get the photo in one tap: on a phone this opens the
 *  camera directly. */
export function Post1({ h }: { h: Handoff }) {
  const fileRef = useRef<HTMLInputElement>(null)

  const openPicker = () => {
    if (h.live) fileRef.current?.click()
    else h.shoot()
  }

  return (
    <div className="screen">
      <div style={{ padding: '58px 16px 10px', borderBottom: '2px solid var(--color-divider)', display: 'flex', alignItems: 'center' }}>
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

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => h.pickPhoto(e.target.files?.[0] ?? null)}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px' }}>
        {!h.photo ? (
          <button
            onClick={openPicker}
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
            <div
              className={h.photoPreview ? undefined : 'hatch-lg'}
              style={{
                height: 300,
                border: '1px solid var(--color-divider)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: 12,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {h.photoPreview && (
                <img
                  src={h.photoPreview}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(1) contrast(1.08)',
                  }}
                />
              )}
              <span
                style={{
                  position: 'relative',
                  fontSize: 9,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: h.photoPreview ? 'var(--color-bg)' : 'var(--color-neutral-700)',
                  textShadow: h.photoPreview ? '0 1px 3px rgba(0,0,0,.7)' : undefined,
                }}
              >
                Photo{h.me.building ? ` · shot in ${h.me.building}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
              <button onClick={openPicker} className="btn btn-secondary" style={{ fontSize: 12 }}>
                Retake
              </button>
              <div style={{ fontSize: 12.5, opacity: 0.65, textWrap: 'pretty', flex: 1 }}>
                That is the only photo you need. Next you write one paragraph.
              </div>
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
