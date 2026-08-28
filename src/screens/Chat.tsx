import { useState } from 'react'
import { ArrowRight, Check, Star } from 'lucide-react'
import { AppBody, AppFooter, AppHeader } from '../components/Shell'
import type { Barter } from '../lib/useBarter'

const CHIPS = ['On my way', 'Can I come at 7?', 'Still available?']

/** Chat (thread): finish the arrangement, with the meetup already written down. */
export function Chat({ h }: { h: Barter }) {
  const t = h.activeThread
  const fallback = h.item(h.selId)
  const name = t?.otherName ?? fallback.seller
  const handoffs = t?.otherHandoffs ?? fallback.handoffs
  const spot = t?.spotName ?? h.spotLabel()
  const window_ = t?.pickupWindow ?? h.win
  const first = name.split(' ')[0]
  const { myDone, theirDone, completed } = h.handoffState
  const [stars, setStars] = useState(0)
  const [note, setNote] = useState('')
  const [rated, setRated] = useState(false)

  return (
    <div className="screen">
      <AppHeader
        title={name}
        kicker={`${handoffs} handoffs · verified email`}
        onBack={h.jumpChats}
        action={
          <button
            onClick={() => h.flash('Reported. This account is hidden from you and flagged for review.')}
            className="btn btn-ghost"
            style={{ fontSize: 12 }}
          >
            Block
          </button>
        }
      />

      <AppBody>
        {/* pinned handoff card — the meetup, then the confirmation loop */}
        <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-lg)', padding: '11px 12px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>
            {completed ? 'Handed off' : 'BetterBarter scheduled'}
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15, marginTop: 4 }}>{spot}</div>
          <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 2 }}>
            {completed ? window_ : `${window_} · held for 3 hours`}
            {t?.listingTitle ? ` · ${t.listingTitle}` : ''}
          </div>

          <div style={{ borderTop: '1px solid var(--color-divider)', marginTop: 11, paddingTop: 10 }}>
            {completed ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Check size={16} strokeWidth={2.6} style={{ flex: 'none', marginTop: 1, color: 'var(--color-accent)' }} />
                <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                  Both of you confirmed. <strong>+1 handoff</strong> each, and the listing is off the board.
                </div>
              </div>
            ) : myDone ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4, opacity: 0.75 }}>
                  You marked this handed off. Waiting for {first} to confirm.
                </div>
                <button
                  onClick={() => h.markHandedOff(false)}
                  disabled={h.confirming}
                  className="btn btn-ghost"
                  style={{ flex: 'none', fontSize: 12 }}
                >
                  Undo
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => h.markHandedOff(true)}
                  disabled={h.confirming}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {theirDone ? 'Confirm the handoff' : 'Mark as handed off'}
                </button>
                <div style={{ fontSize: 11.5, opacity: 0.6, marginTop: 7, textWrap: 'pretty' }}>
                  {theirDone
                    ? `${first} says it happened. Your tap is the one that counts it — +1 for both of you.`
                    : 'Both of you tap this after the item changes hands. It ends the hold and adds +1 to each handoff count.'}
                </div>
              </>
            )}
          </div>
        </div>

        {h.msgs.map((m) => (
          <div key={m.id} style={{ display: 'flex' }}>
            {m.who === 'me' ? (
              <div
                style={{
                  marginLeft: 'auto',
                  maxWidth: '76%',
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                  padding: '10px 12px',
                  fontSize: 14,
                  lineHeight: 1.35,
                }}
              >
                {m.text}
              </div>
            ) : (
              <div
                style={{
                  maxWidth: '76%',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-divider)',
                  padding: '10px 12px',
                  fontSize: 14,
                  lineHeight: 1.35,
                }}
              >
                {m.text}
              </div>
            )}
          </div>
        ))}

        {h.live && h.msgs.length <= 1 && (
          <div style={{ fontSize: 11.5, opacity: 0.55, textWrap: 'pretty' }}>
            {name.split(' ')[0]} gets this on their board. Replies show up here the moment they send one.
          </div>
        )}
        {/* the last step of the flow: rate the person you just met */}
        {completed && !rated && (
          <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-lg)', padding: '13px 14px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15 }}>
              How was {first}?
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 2, lineHeight: 1.45 }}>
              Showed up, described it honestly, easy to deal with? One tap. It is the only thing the next person has to
              go on.
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 11 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  aria-label={n + ' stars'}
                  style={{
                    border: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 2,
                    color: n <= stars ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-text) 30%, transparent)',
                  }}
                >
                  <Star size={26} strokeWidth={1.9} fill={n <= stars ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            {stars > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 11, alignItems: 'center' }}>
                <input
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything worth saying (optional)"
                />
                <button
                  onClick={() => {
                    h.rateThread(stars, note)
                    setRated(true)
                  }}
                  className="btn btn-primary"
                  style={{ flex: 'none' }}
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}
      </AppBody>

      <AppFooter>
      {/* quick-reply chips */}
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto' }}>
        {CHIPS.map((c) => (
          <button key={c} onClick={() => h.sendText(c)} className="btn btn-secondary" style={{ flex: 'none', fontSize: 12.5, fontWeight: 500 }}>
            {c}
          </button>
        ))}
      </div>

      {/* composer */}
      <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
        <input
          className="input"
          placeholder="Message"
          value={h.draftMsg}
          onChange={(e) => h.setDraftMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') h.sendText(h.draftMsg)
          }}
        />
        <button
          onClick={() => h.sendText(h.draftMsg)}
          style={{
            flex: 'none',
            border: 0,
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            width: 44,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ArrowRight size={19} strokeWidth={2} />
        </button>
      </div>
      </AppFooter>
    </div>
  )
}
