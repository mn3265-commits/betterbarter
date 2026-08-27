import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Auth } from '../lib/useAuth'
import type { Handoff } from '../lib/useHandoff'

/** Gate (sign-in): states the one thing that makes the product different.
 *  With a live backend it offers Google (LionMail) sign-in plus a magic-link
 *  fallback; without one it's the demo. */
export function Gate({ h, auth }: { h: Handoff; auth?: Auth }) {
  const live = Boolean(auth?.configured)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [gBusy, setGBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function send() {
    if (!auth || !email.trim()) return
    setBusy(true)
    setErr(null)
    try {
      await auth.signIn(email)
      setSent(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not send the link. Try again.')
    } finally {
      setBusy(false)
    }
  }

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
      style={{ background: 'var(--color-accent)', color: 'var(--color-bg)', padding: '74px 26px 46px' }}
    >
      {/* One column on a phone; on a laptop these two halves sit side by side
          (see app.css) — what this is on the left, the way in on the right. */}
      <div className="gate__intro">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', opacity: 0.85 }}>
          Campus reuse, counted · Columbia
        </div>
        {/* The only way back to the public site, for anyone who arrived here first. */}
        <a
          href="/"
          style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-bg)', opacity: 0.8, textDecoration: 'underline' }}
        >
          What is this?
        </a>
      </div>
      <div style={{ height: 2, background: 'var(--color-bg)', opacity: 0.5, margin: '14px 0 22px' }} />
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 60, lineHeight: 1.02, letterSpacing: '-.015em' }}>
        Handoff
      </div>
      <p style={{ fontSize: 17, lineHeight: 1.35, margin: '20px 0 0', maxWidth: '24ch' }}>
        Give away or resell what you are done with — to someone in your own building.
      </p>

      {/* The three promises, in the order they matter. They also stop the screen
          from being a wordmark floating in an empty red field on a laptop. */}
      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {[
          ['One verified school email', 'One campus per board. No strangers, ever.'],
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
          Columbia only, for now. Sign in with the address you already have.
        </div>

        {live && !sent ? (
          <>
            {/* Primary: one-tap Columbia Google (LionMail) sign-in. */}
            <button
              onClick={() => void google()}
              disabled={gBusy}
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
                cursor: gBusy ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                opacity: gBusy ? 0.6 : 1,
              }}
            >
              <span>{gBusy ? 'Opening Google…' : 'Continue with Google'}</span>
              <ArrowRight size={20} strokeWidth={2} />
            </button>

            {/* Secondary: magic-link fallback. */}
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>or use your school email</div>
            <input
              className="input"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="you@columbia.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void send()
              }}
              style={{
                background: 'color-mix(in srgb, var(--color-bg) 16%, transparent)',
                border: '1.5px solid color-mix(in srgb, var(--color-bg) 50%, transparent)', borderRadius: 'var(--radius-md)',
                color: 'var(--color-bg)',
                caretColor: 'var(--color-bg)',
                minHeight: 46,
                fontSize: 15,
              }}
            />
            <button
              onClick={() => void send()}
              disabled={busy || !email.trim()}
              style={{
                border: '1.5px solid var(--color-bg)', borderRadius: 'var(--radius-md)',
                background: 'transparent',
                color: 'var(--color-bg)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 14,
                padding: '12px 16px',
                textAlign: 'left',
                cursor: busy ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                opacity: busy || !email.trim() ? 0.6 : 1,
              }}
            >
              <span>{busy ? 'Sending…' : 'Email me a login link'}</span>
              <ArrowRight size={18} strokeWidth={2} />
            </button>
            {err && <div style={{ fontSize: 12, opacity: 0.95 }}>{err}</div>}
          </>
        ) : live && sent ? (
          <>
            <div style={{ border: '1.5px solid var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '14px 16px', fontSize: 15, lineHeight: 1.4 }}>
              Check <b>{email}</b> for a login link. Open it on this device and you are in.
            </div>
            <button
              onClick={() => {
                setSent(false)
                setErr(null)
              }}
              style={{
                border: '1.5px solid var(--color-bg)', borderRadius: 'var(--radius-md)',
                background: 'transparent',
                color: 'var(--color-bg)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 14,
                padding: '11px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Back
            </button>
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
