import { Check } from 'lucide-react'
import { AppBody, AppHeader } from '../components/Shell'
import { TabBar } from '../components/TabBar'
import type { SwapUp } from '../lib/useSwapUp'

/** Chats list — tab 4. One row per thread, or an empty state. */
export function Chats({ h }: { h: SwapUp }) {
  // In demo mode there is one synthetic thread; live mode lists real ones.
  const rows = h.live
    ? h.threads
    : h.msgs.length
      ? [
          {
            id: 'demo',
            otherName: h.item(h.selId).seller,
            otherHandoffs: h.item(h.selId).handoffs,
            listingTitle: h.item(h.selId).title,
            spotName: h.spotLabel(),
            pickupWindow: h.win,
            lastMessage: h.msgs[h.msgs.length - 1].text,
            myDone: h.handoffState.myDone,
            theirDone: h.handoffState.theirDone,
            completed: h.handoffState.completed,
          },
        ]
      : []

  return (
    <div className="screen">
      <AppHeader title="Chats" />

      <AppBody pad={false}>
        {rows.length > 0 ? (
          rows.map((t) => {
            const initials = t.otherName
              .split(' ')
              .filter(Boolean)
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
            return (
              <div
                key={t.id}
                onClick={() => (h.live ? h.openThread(t.id) : h.jumpChat())}
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
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15 }}>{t.otherName}</div>
                  <div style={{ fontSize: 12, opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.lastMessage || t.spotName}
                  </div>
                </div>
                {t.completed ? (
                  <Check size={16} strokeWidth={2.6} style={{ flex: 'none', opacity: 0.5 }} />
                ) : t.theirDone && !t.myDone ? (
                  <div
                    style={{ flex: 'none', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-accent)' }}
                  >
                    Confirm
                  </div>
                ) : (
                  <div style={{ width: 8, height: 8, background: 'var(--color-accent)', flex: 'none' }} />
                )}
              </div>
            )
          })
        ) : (
          <div style={{ padding: '40px 22px', textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20, lineHeight: 1.15 }}>Nothing yet.</div>
            <p style={{ fontSize: 13.5, opacity: 0.65, margin: '8px 0 16px', textWrap: 'pretty' }}>
              Claim something on the board and the conversation starts itself, with the meetup spot already in it.
            </p>
            <button onClick={h.jumpBrowse} className="btn btn-primary">
              Go to the board
            </button>
          </div>
        )}
      </AppBody>

      <div className="app-note">Messages stay in the app so there is a record if a handoff goes wrong.</div>
      <TabBar h={h} />
    </div>
  )
}
