import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { fetchTeaser, type Teaser } from '../lib/api'
import type { Auth } from '../lib/useAuth'
import type { Barter } from '../lib/useBarter'

/** Gate (sign-in): states the one thing that makes the product different.
 *  With a live backend it offers Google (LionMail) sign-in plus a magic-link
 *  fallback; without one it's the demo. */
export function Gate({ h, auth }: { h: Barter; auth?: Auth }) {
  /* The campus can come in on the link — betterbarter.vercel.app/app?c=columbia.edu
     — so an invitation says what is waiting on the Marketplace it is inviting you to. */
  const [teaser, setTeaser] = useState<Teaser | null>(null)
  useEffect(() => {
    const domain = new URLSearchParams(window.location.search).get('c')
    let alive = true
    void fetchTeaser(domain).then((t) => { if (alive) setTeaser(t) })
    return () => { alive = false }
  }, [])

  const live = Boolean(auth?.configured)
  const [gBusy, setGBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function google() {
    if (!auth) return
    setGBusy(true)
    setErr(null)
    try {
      await auth.signInWithGoogle()
      // On success the browser redirects to Google; nothing more to do here.
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not start Google sign-in.')
      setGBusy(false)
    }
  }

  return (
    <div
      className="screen gate"
      style={{ background: 'var(--color-accent)', color: 'var(--color-on-accent)', padding: '74px 26px 46px' }}
    >
      {/* One column on a phone; on a laptop these two halves sit side by side
          (see app.css) — what this is on the left, the way in on the right. */}
      <div className="gate__intro">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', opacity: 0.85 }}>
          Campus reuse, counted
        </div>
        {/* The only way back to the public site, for anyone who arrived here first. */}
        <a
          href="/"
          style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-on-accent)', opacity: 0.7, textDecoration: 'underline' }}
        >
          What is this?
        </a>
      </div>
      <div style={{ height: 2, background: 'var(--color-bg)', opacity: 0.5, margin: '14px 0 22px' }} />
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 60, lineHeight: 1.02, letterSpacing: '-.015em' }}>
        BetterBarter
      </div>
      <p style={{ fontSize: 17, lineHeight: 1.35, margin: '20px 0 0', maxWidth: '24ch' }}>
        Give away, sell, rent or swap what you are done with — to someone in your own building.
      </p>

      {/* What is actually behind the sign-in button. A person handed this link
          during orientation has no other way to know, and a number is the
          difference between signing in and closing the tab. */}
      {teaser && teaser.live > 0 && (
        <div
          style={{
            marginTop: 18,
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 8,
            flexWrap: 'wrap',
            border: '1px solid color-mix(in srgb, var(--color-bg) 45%, transparent)',
            borderRadius: 999,
            padding: '8px 14px',
            alignSelf: 'flex-start',
          }}
        >
          <b style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17 }}>
            {teaser.live} things
          </b>
          <span style={{ fontSize: 13, opacity: 0.9 }}>
            on the {teaser.campus ?? 'board'} right now
            {teaser.free > 0 ? ` · ${teaser.free} free` : ''}
          </span>
        </div>
      )}

      {/* The three promises, in the order they matter. They also stop the screen
          from being a wordmark floating in an empty red field on a laptop. */}
      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {[
          ['One verified school email', 'One Marketplace per campus. No strangers, ever.'],
          ['Meet in a lobby', 'No shipping, no packaging, no van. It never leaves the building.'],
          ['Both sides confirm it', 'That tap is what counts the object as kept in use.'],
        ].map(([title, line]) => (
          <div key={title} style={{ borderTop: '1px solid color-mix(in srgb, var(--color-bg) 45%, transparent)', padding: '11px 0' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{title}</div>
            <div style={{ fontSize: 12.5, opacity: 0.85, lineHeight: 1.4, marginTop: 2 }}>{line}</div>
          </div>
        ))}
      </div>

      </div>

      <div className="gate__signin" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.9, letterSpacing: '.02em' }}>
          Sign in with your university email. Your school gets its own Marketplace — if it has no Marketplace yet, yours opens it.
        </div>

        {live ? (
          <>
            {/* One way in: the university's own single sign-on. An email link
                was a second door with weaker proof, and every account here is
                only as trustworthy as the login behind it. */}
            <button
              onClick={() => void google()}
              disabled={gBusy}
              style={{
                border: 0,
                background: 'var(--color-bg)',
                color: 'var(--color-accent-700)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 16,
                padding: '16px 18px',
                textAlign: 'left',
                cursor: gBusy ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                opacity: gBusy ? 0.6 : 1,
              }}
            >
              <span>{gBusy ? 'Opening single sign-on…' : 'Sign in with your university account'}</span>
              <ArrowRight size={20} strokeWidth={2} />
            </button>
            <div style={{ fontSize: 11.5, opacity: 0.8, lineHeight: 1.45 }}>
              We never see a password: your university signs you in, and we only learn that the address is real and
              which campus it belongs to.
            </div>
            {err && <div style={{ fontSize: 12, opacity: 0.95 }}>{err}</div>}
          </>
        ) : (
          <>
            <button
              onClick={h.signIn}
              style={{
                border: 0,
                background: 'var(--color-bg)',
                color: 'var(--color-accent-700)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 16,
                padding: '16px 18px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span>Continue with school email</span>
              <ArrowRight size={20} strokeWidth={2} />
            </button>
            <div style={{ fontSize: 11, opacity: 0.75 }}>
              We re-check the login every term. If your school email stops working, so does the account.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
