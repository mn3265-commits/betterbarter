import { ArrowRight } from 'lucide-react'
import type { Handoff } from '../lib/useHandoff'

/** Gate (sign-in): states the one thing that makes the product different. */
export function Gate({ h }: { h: Handoff }) {
  return (
    <div
      className="screen"
      style={{
        background: 'var(--color-accent)',
        color: 'var(--color-bg)',
        padding: '74px 26px 46px',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', opacity: 0.85 }}>
        Any university · trial at Columbia
      </div>
      <div style={{ height: 2, background: 'var(--color-bg)', opacity: 0.5, margin: '14px 0 22px' }} />
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: 62,
          lineHeight: 0.94,
          letterSpacing: '-.025em',
        }}
      >
        HAND
        <br />
        OFF
      </div>
      <p style={{ fontSize: 17, lineHeight: 1.35, margin: '20px 0 0', maxWidth: '22ch' }}>
        Give it away or sell it to someone else on campus. Starting at Columbia.
      </p>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.9, letterSpacing: '.02em' }}>
          No strangers. One verified school email per account, and you only ever see your own campus.
        </div>
        <button
          onClick={h.signIn}
          style={{
            border: 0,
            background: 'var(--color-bg)',
            color: 'var(--color-accent-700)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
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
      </div>
    </div>
  )
}
