import { useRef } from 'react'
import { Camera } from 'lucide-react'
import { AppBody, AppFooter, AppHeader } from '../components/Shell'
import type { Barter } from '../lib/useBarter'

/** Post, step 1 — photo. Get the photo in one tap: on a phone this opens the
 *  camera directly. */
export function Post1({ h }: { h: Barter }) {
  const fileRef = useRef<HTMLInputElement>(null)

  const openPicker = () => {
    if (h.live) fileRef.current?.click()
    else h.shoot()
  }

  return (
    <div className="screen">
      <AppHeader kicker="Step 1 of 2" title="Photo" onBack={h.jumpBrowse} />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => h.pickPhoto(e.target.files?.[0] ?? null)}
      />

      <AppBody>
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
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20 }}>Snap, snap, snap</span>
            <span style={{ fontSize: 12.5, opacity: 0.65 }}>Maximum 3 photos.</span>
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
      </AppBody>

      <AppFooter>
        <button onClick={h.toStep2} disabled={!h.photo} className="app-cta">
          Next — say what it is
        </button>
      </AppFooter>
    </div>
  )
}
