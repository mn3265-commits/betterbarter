import { useRef } from 'react'
import { Camera, Plus, X } from 'lucide-react'
import { AppBody, AppFooter, AppHeader } from '../components/Shell'
import { MAX_PHOTOS } from '../lib/taxonomy'
import type { Barter } from '../lib/useBarter'

/**
 * Post, step 1 — photos.
 *
 * Up to three. The screen has promised three since the 28th while holding
 * exactly one and calling the second attempt a "Retake", which is how Tessa
 * found it. Three matters for the things this board is actually for: a desk
 * photographed from one angle is a desk nobody trusts, and a scratch you cannot
 * see is the reason someone turns up and walks away.
 *
 * The first photo is the cover — it is the one on the board — so the order is
 * the order they were taken, and any of them can be dropped.
 */
export function Post1({ h }: { h: Barter }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const shots = h.photoPreviews
  const room = MAX_PHOTOS - shots.length

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
        onChange={(e) => {
          h.pickPhoto(e.target.files?.[0] ?? null)
          e.target.value = '' // so the same file can be picked again
        }}
      />

      <AppBody>
        {shots.length === 0 ? (
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
            <span style={{ fontSize: 12.5, opacity: 0.65 }}>Up to three photos.</span>
          </button>
        ) : (
          <>
            {/* the cover, big — this is the one the board shows */}
            <div
              style={{
                height: 288,
                border: '1px solid var(--color-divider)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: 12,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img
                src={shots[0]}
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
              <span
                style={{
                  position: 'relative',
                  fontSize: 9,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-bg)',
                  textShadow: '0 1px 3px rgba(0,0,0,.7)',
                }}
              >
                Cover{h.me.building ? ` · shot in ${h.me.building}` : ''}
              </span>
            </div>

            {/* the rest, plus the slot for another */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {shots.map((src, i) => (
                <div key={src} style={{ position: 'relative', width: 82, height: 82, flex: 'none' }}>
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      border: '1px solid var(--color-divider)',
                      filter: 'grayscale(1) contrast(1.08)',
                    }}
                  />
                  <button
                    onClick={() => h.dropPhoto(i)}
                    aria-label={`Remove photo ${i + 1}`}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      border: '1px solid var(--color-divider)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    <X size={13} strokeWidth={2.4} />
                  </button>
                  {i === 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 4,
                        bottom: 4,
                        fontSize: 8.5,
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-bg)',
                        textShadow: '0 1px 3px rgba(0,0,0,.8)',
                      }}
                    >
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {room > 0 && (
                <button
                  onClick={openPicker}
                  style={{
                    width: 82,
                    height: 82,
                    flex: 'none',
                    border: '2px dashed var(--color-divider)',
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    color: 'var(--color-text)',
                  }}
                >
                  <Plus size={17} strokeWidth={2} />
                  <span style={{ fontSize: 10, opacity: 0.7 }}>Add</span>
                </button>
              )}
            </div>

            <div style={{ fontSize: 12.5, opacity: 0.65, marginTop: 10, textWrap: 'pretty' }}>
              {room > 0
                ? `${shots.length} of ${MAX_PHOTOS}. One more angle is usually the difference between a message and a shrug.`
                : `${MAX_PHOTOS} photos, that is the lot. Tap one to drop it if you want a different angle.`}
            </div>
          </>
        )}
      </AppBody>

      <AppFooter>
        <button onClick={h.toStep2} disabled={shots.length === 0} className="app-cta">
          Next — say what it is
        </button>
      </AppFooter>
    </div>
  )
}
