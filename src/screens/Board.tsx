import { ChevronRight } from 'lucide-react'
import { TabBar } from '../components/TabBar'
import { ITEMS, WANTED } from '../data/seed'
import type { Item } from '../data/types'
import type { Handoff } from '../lib/useHandoff'

function walkTime(loc: string): string {
  if (loc.startsWith('Carman')) return '1 min'
  if (loc.startsWith('John Jay')) return '4 min'
  if (loc.startsWith('Wallach')) return '6 min'
  return '9 min'
}

/** Board (the board) — tab 1. Scan what is available on campus right now. */
export function Board({ h }: { h: Handoff }) {
  const q = h.q.trim().toLowerCase()
  const pool = h
    .all()
    .filter((it) => (h.tab === 'free' ? h.isFree(it) : !h.isFree(it)) && !h.isPaused(it))
  const cards = pool.filter((it) => !q || (it.title + ' ' + it.cat).toLowerCase().includes(q))

  // The two demo listings that can go stale (day-7 freshness check).
  const staleMine = [ITEMS[6], ITEMS[7]].filter((it) => h.isStale(it))

  return (
    <div className="screen">
      {/* header */}
      <div
        style={{
          padding: '60px 16px 10px',
          borderBottom: '2px solid var(--color-divider)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 19,
            letterSpacing: '-.02em',
            marginRight: 'auto',
          }}
        >
          HANDOFF
        </div>
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            color: 'var(--color-accent-700)',
            textAlign: 'right',
            lineHeight: 1.25,
          }}
        >
          Columbia
          <br />
          <span style={{ opacity: 0.7 }}>All halls</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 14 }}>
        {/* count line */}
        <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em' }}>
            {h.liveCount} live
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>across campus · closest to you first</div>
        </div>

        {/* stale nudge */}
        {staleMine.length > 0 && (
          <div
            onClick={h.jumpMe}
            style={{
              margin: '12px 16px 0',
              background: 'var(--color-accent-100)',
              border: '1px solid var(--color-accent-300)',
              padding: '11px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: 13.5,
                  color: 'var(--color-accent-800)',
                }}
              >
                {staleMine.length} of your listings passed a week
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-accent-800)', opacity: 0.8 }}>
                Say whether they are still there, or the board pauses them.
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} style={{ color: 'var(--color-accent-700)' }} />
          </div>
        )}

        {/* move-out banner (seasonal) */}
        {h.moveOut && (
          <div
            style={{
              margin: '12px 16px 0',
              border: '2px solid var(--color-text)',
              padding: '12px 13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>
              Move-out week · May 12–19
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 17, lineHeight: 1.15 }}>
              Everything left in the hall on Friday gets thrown out.
            </div>
            <button
              onClick={h.startPost}
              style={{
                alignSelf: 'flex-start',
                border: 0,
                background: 'var(--color-text)',
                color: 'var(--color-bg)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 13,
                padding: '9px 13px',
                cursor: 'pointer',
              }}
            >
              Empty my room
            </button>
          </div>
        )}

        {/* search */}
        <div style={{ padding: '14px 16px 0' }}>
          <input
            className="input"
            placeholder="Search desk lamp, fridge, mirror…"
            value={h.q}
            onChange={(e) => h.setQ(e.target.value)}
          />
        </div>

        {/* segmented control */}
        <div style={{ padding: '12px 16px 0' }}>
          <div className="seg" style={{ width: '100%' }}>
            <label className="seg-opt" style={{ flex: 1, justifyContent: 'flex-start' }}>
              <input type="radio" name="hf-tab" checked={h.tab === 'free'} onChange={() => h.setTab('free')} />
              <span>Free</span>
            </label>
            <label className="seg-opt" style={{ flex: 1, justifyContent: 'flex-start' }}>
              <input type="radio" name="hf-tab" checked={h.tab === 'sale'} onChange={() => h.setTab('sale')} />
              <span>For sale</span>
            </label>
            <label className="seg-opt" style={{ flex: 1, justifyContent: 'flex-start' }}>
              <input type="radio" name="hf-tab" checked={h.tab === 'wanted'} onChange={() => h.setTab('wanted')} />
              <span>Wanted</span>
            </label>
          </div>
        </div>

        {/* wanted list */}
        {h.tab === 'wanted' && (
          <div style={{ padding: '14px 16px 0' }}>
            <p style={{ fontSize: 12, opacity: 0.65, margin: '0 0 12px', textWrap: 'pretty' }}>
              Wanted posts run the board in reverse: buyers say what they need, and the board stays full even when the
              shelves are empty.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-divider)' }}>
              {WANTED.map((w) => (
                <div
                  key={w.id}
                  style={{ background: 'var(--color-bg)', padding: '12px 0', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15 }}>{w.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                      {w.who} · {w.handoffs} handoffs · {w.ago}
                    </div>
                  </div>
                  <button onClick={() => h.offerWanted(w.title, w.who)} className="btn btn-secondary" style={{ flex: 'none' }}>
                    I have one
                  </button>
                </div>
              ))}
            </div>
            <button onClick={h.startPost} className="btn btn-ghost" style={{ marginTop: 14 }}>
              Post what you need →
            </button>
          </div>
        )}

        {/* item grid (Free / For sale) */}
        {h.tab !== 'wanted' && (
          <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {cards.map((it) => (
              <ItemCard key={it.id} it={it} h={h} walk={walkTime(it.loc)} />
            ))}
          </div>
        )}
      </div>

      <TabBar h={h} />
    </div>
  )
}

function ItemCard({ it, h, walk }: { it: Item; h: Handoff; walk: string }) {
  const isGone = h.gone.includes(it.id)
  return (
    <div
      onClick={() => h.openDetail(it.id)}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 7 }}
    >
      <div
        className="hatch-sm"
        style={{
          height: 118,
          border: '1px solid var(--color-divider)',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          padding: 7,
        }}
      >
        <span style={{ fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>
          {it.cat} · {it.loc}
        </span>
        {isGone && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'color-mix(in srgb, var(--color-neutral-900) 72%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '.1em',
            }}
          >
            GONE
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 13, color: 'var(--color-accent-700)' }}>
          {h.priceOf(it)}
        </div>
        <div style={{ fontSize: 10, opacity: 0.55, marginLeft: 'auto' }}>{it.ago}</div>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.25 }}>{it.title}</div>
      <div style={{ fontSize: 10.5, opacity: 0.55 }}>
        {it.loc} · {walk} walk
      </div>
    </div>
  )
}
