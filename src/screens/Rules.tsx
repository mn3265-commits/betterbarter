import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { AppBody, AppFooter, AppHeader } from '../components/Shell'
import { RULES, RULES_SUMMARY } from '../lib/rules'

/**
 * The community rules. In `accept` mode this is the gate every new account
 * passes through once — you cannot reach the board without agreeing. In `read`
 * mode it is the same text, reachable any time from Me.
 */
export function Rules({
  mode,
  campus,
  onAccept,
  onClose,
  busy,
}: {
  mode: 'accept' | 'read'
  campus?: string
  onAccept?: () => void
  onClose?: () => void
  busy?: boolean
}) {
  const [agreed, setAgreed] = useState(false)
  const accepting = mode === 'accept'

  return (
    <div className="screen">
      <AppHeader
        title={accepting ? 'Before you start' : 'Community rules'}
        action={
          !accepting && onClose ? (
            <button onClick={onClose} className="btn btn-ghost" style={{ fontSize: 12 }}>
              Done
            </button>
          ) : undefined
        }
      />

      <AppBody>
        {accepting && (
          <>
            <h3 style={{ fontSize: 24, margin: '0 0 8px', lineHeight: 1.12 }}>
              This is a board for {campus || 'your campus'}, run on trust.
            </h3>
            <p style={{ fontSize: 13.5, opacity: 0.72, margin: '0 0 4px', textWrap: 'pretty' }}>
              Everyone here proved they go to your school. The handoff itself happens in a lobby, between two people, and
              no app is standing there — so these rules are the whole safety net. Read them once.
            </p>
          </>
        )}

        <div
          style={{
            marginTop: accepting ? 18 : 4,
            border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '9px 12px',
              background: 'var(--color-text)',
              color: 'var(--color-bg)',
              fontSize: 10,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
            }}
          >
            {RULES_SUMMARY}
          </div>
          {RULES.map((s) => (
            <div key={s.title} style={{ padding: '13px 12px', borderTop: '1px solid var(--color-divider)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>
                {s.title}
              </div>
              <p style={{ fontSize: 12.5, opacity: 0.75, margin: '6px 0 0', lineHeight: 1.45, textWrap: 'pretty' }}>
                {s.body}
              </p>
              {s.items && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 0, listStyle: 'none' }}>
                  {s.items.map((it) => (
                    <li
                      key={it}
                      style={{
                        fontSize: 12.5,
                        lineHeight: 1.4,
                        padding: '5px 0 5px 14px',
                        borderTop: '1px solid var(--color-divider)',
                        position: 'relative',
                      }}
                    >
                      <span style={{ position: 'absolute', left: 0, color: 'var(--color-accent-700)', fontWeight: 800 }}>
                        ·
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {accepting && (
          <label
            className="radio"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 11,
              marginTop: 18,
              border: '1px solid var(--color-divider)',
              padding: 13,
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
            <span
              aria-hidden
              style={{
                width: 20,
                height: 20,
                flex: 'none',
                marginTop: 1,
                border: agreed ? '1.5px solid var(--color-accent)' : '1.5px solid var(--color-divider)',
                background: agreed ? 'var(--color-accent)' : 'transparent',
                color: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {agreed && <Check size={14} strokeWidth={3} />}
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.4, textWrap: 'pretty' }}>
              I agree to these rules. I will not post anything dangerous, illegal, or not mine, and I will meet in
              public.
            </span>
          </label>
        )}
      </AppBody>

      {accepting && (
        <AppFooter>
          <button onClick={onAccept} disabled={!agreed || busy} className="app-cta">
            <span>{busy ? 'One moment…' : 'Agree and continue'}</span>
            <ArrowRight size={20} strokeWidth={2} />
          </button>
        </AppFooter>
      )}
    </div>
  )
}
