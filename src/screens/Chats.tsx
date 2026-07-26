import { TabBar } from '../components/TabBar'
import type { Handoff } from '../lib/useHandoff'

/** Chats list — tab 4. One row per thread, or an empty state. */
export function Chats({ h }: { h: Handoff }) {
  const d0 = h.item(h.selId)
  const hasThread = h.msgs.length > 0
  const lastMsg = hasThread ? h.msgs[h.msgs.length - 1].text : ''
  const initials = d0.seller
    .split(' ')
    .map((w) => w[0])
    .join('')

  return (
    <div className="screen">
      <div
        style={{
          padding: '60px 16px 10px',
          borderBottom: '2px solid var(--color-divider)',
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: 19,
        }}
      >
        Chats
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {hasThread ? (
          <div
            onClick={h.jumpChat}
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-divider)',
              cursor: 'pointer',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                flex: 'none',
                background: 'var(--color-neutral-300)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                color: 'var(--color-neutral-800)',
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15 }}>{d0.seller}</div>
              <div style={{ fontSize: 12, opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lastMsg}
              </div>
            </div>
            <div style={{ width: 8, height: 8, background: 'var(--color-accent)', flex: 'none' }} />
          </div>
        ) : (
          <div style={{ padding: '40px 22px', textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, lineHeight: 1.15 }}>Nothing yet.</div>
            <p style={{ fontSize: 13.5, opacity: 0.65, margin: '8px 0 16px', textWrap: 'pretty' }}>
              Claim something on the board and the conversation starts itself, with the meetup spot already in it.
            </p>
            <button onClick={h.jumpBrowse} className="btn btn-primary">
              Go to the board
            </button>
          </div>
        )}
      </div>

      <div style={{ borderTop: '2px solid var(--color-divider)', padding: '14px 16px 8px', fontSize: 11.5, opacity: 0.6 }}>
        Messages stay in the app so there is a record if a handoff goes wrong.
      </div>
      <TabBar h={h} />
    </div>
  )
}
