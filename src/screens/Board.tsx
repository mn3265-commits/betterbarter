import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Photo } from '../components/Photo'
import { CategoryIcon } from '../components/CategoryIcon'
import { TabBar } from '../components/TabBar'
import { CATEGORIES } from '../lib/taxonomy'
import type { Item } from '../data/types'
import type { Barter } from '../lib/useBarter'

/**
 * How an object is moving, as a colour rather than as a tab.
 *
 * Tessa's review of 28 August moved the board's first question from "how do you
 * want to get it" to "what are you looking for" — which is the question people
 * actually arrive with. Kind stops being the axis you browse along and becomes
 * a mark on the card, so a category shows everything in it at once.
 */
const KIND_MARK: Record<string, { label: string; fg: string; bg: string }> = {
  free:  { label: 'FREE',  fg: 'var(--color-accent-800)',  bg: 'var(--color-accent-100)' },
  sale:  { label: 'SALE',  fg: 'var(--color-signal-700)',  bg: 'var(--color-signal-100)' },
  trade: { label: 'SWAP',  fg: 'var(--color-neutral-800)', bg: 'var(--color-neutral-200)' },
  rent:  { label: 'RENT',  fg: 'var(--color-neutral-700)', bg: 'var(--color-neutral-100)' },
}

/** Walk time from the viewer's own hall. Same building = same door. */
/** Board (the board) — tab 1. Scan what is available on campus right now. */
export function Board({ h }: { h: Barter }) {
  const q = h.q.trim().toLowerCase()
  const [cat, setCat] = useState<string | null>(null)
  const [kind, setKind] = useState<'all' | 'free' | 'sale' | 'trade' | 'rent'>('all')

  /* Everything live on this campus, before either filter — the category counts
     have to be counted against this or they lie about what is behind them. */
  const live = h
    .all()
    .filter((it) => (h.live ? it.status === 'active' : !h.isPaused(it)))

  const pool = live
    .filter((it) => (kind === 'all' ? h.kindOf(it) !== 'rent' : h.kindOf(it) === kind))
    .filter((it) => !cat || it.cat === cat)
    // Radius, not a map: everything on this campus is already close, so the
    // filter is "how far am I willing to walk", in three coarse steps.
    .filter((it) => {
      if (!h.radiusKm) return true
      const km = h.distanceOf(it)
      return km == null || km <= h.radiusKm
    })
    .sort((a, b) => {
      const da = h.distanceOf(a)
      const db = h.distanceOf(b)
      if (da == null || db == null) return 0
      return da - db
    })
  const cards = pool.filter((it) => !q || (it.title + ' ' + it.cat).toLowerCase().includes(q))
  const staleMine = h.staleListings
  const campus = h.campusName || 'campus'

  return (
    <div className="screen">
      {/* header — the board keeps its own, because it carries the campus mark
          and the live count, but it uses the same metrics as every other. */}
      <div
        className="app-hd"
        style={{ alignItems: 'flex-end', gap: 10 }}
      >
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 19,
            letterSpacing: '-.02em',
            marginRight: 'auto',
          }}
        >
          BetterBarter
        </div>
        {h.campusLogo && (
          <img
            src={h.campusLogo}
            alt=""
            width={20}
            height={20}
            style={{ borderRadius: 4, flex: 'none', opacity: 0.9 }}
            onError={(e) => ((e.currentTarget.style.display = 'none'))}
          />
        )}
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
          {campus}
          <br />
          <span style={{ opacity: 0.7 }}>{h.me.building || 'All halls'}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 14 }}>
        {/* count line */}
        <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 26, letterSpacing: '-.02em' }}>
            {h.loadingBoard ? '—' : h.liveCount} live
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
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13.5, color: 'var(--color-accent-800)' }}>
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
              border: '1px solid var(--color-signal)',
              background: 'var(--color-signal-100)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-signal-700)' }}>
              Move-out week · May 12–19
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17, lineHeight: 1.15 }}>
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
                fontWeight: 600,
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

        {/* how far you are willing to walk, when a location has been shared */}
        {h.live && (
          <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {h.hasLocation ? (
              <>
                <span style={{ fontSize: 11, color: 'var(--color-accent-700)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Within
                </span>
                {([
                  [0.4, '5 min'],
                  [1, '15 min'],
                  [null, 'All campus'],
                ] as const).map(([km, label]) => (
                  <button
                    key={label}
                    onClick={() => h.setRadiusKm(km)}
                    className={'btn ' + (h.radiusKm === km ? 'btn-primary' : 'btn-secondary')}
                    style={{ fontSize: 12 }}
                  >
                    {label}
                  </button>
                ))}
              </>
            ) : (
              <button onClick={h.shareLocation} className="btn btn-secondary" style={{ fontSize: 12 }}>
                {h.locating ? 'Asking…' : 'Sort by how close it is'}
              </button>
            )}
          </div>
        )}

        {/* category first — the question people actually arrive with */}
        {h.tab !== 'wanted' && (
          <div style={{ padding: '14px 16px 0', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 7, width: 'max-content', paddingBottom: 2 }}>
              <button
                onClick={() => setCat(null)}
                className={'cat-chip' + (cat === null ? ' is-on' : '')}
              >
                All
                <span className="cat-chip__n">{live.filter((it) => h.kindOf(it) !== 'rent').length}</span>
              </button>
              {CATEGORIES.map((c) => {
                const n = live.filter((it) => it.cat === c && h.kindOf(it) !== 'rent').length
                return (
                  <button
                    key={c}
                    onClick={() => setCat(cat === c ? null : c)}
                    className={'cat-chip' + (cat === c ? ' is-on' : '')}
                  >
                    <CategoryIcon category={c} size={14} />
                    {c.split(' & ')[0]}
                    <span className="cat-chip__n">{n}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* and how it moves, second — colour-coded on the cards either way */}
        {h.tab !== 'wanted' && (
          <div style={{ padding: '10px 16px 0', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {([
              ['all', 'Everything'],
              ['free', 'Free'],
              ['sale', 'For sale'],
              ['trade', 'Swap'],
              ['rent', 'Rent'],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={'btn ' + (kind === k ? 'btn-primary' : 'btn-secondary')}
                style={{ fontSize: 12 }}
              >
                {label}
                {k === 'rent' && <sup className="seg-soon">soon</sup>}
              </button>
            ))}
          </div>
        )}

        {/* renting: announced, not open */}
        {h.tab !== 'wanted' && kind === 'rent' && (
          <div style={{ padding: '18px 16px 0' }}>
            <div className="app-soon">
              <div className="app-soon__tag">Not open yet</div>
              <div className="app-soon__title">Renting is coming</div>
              <p>
                One drill can serve a whole floor, and a fridge for a summer beats buying one. Renting needs a second
                meeting to bring the thing back, so we are finishing that properly before switching it on.
              </p>
              <button
                onClick={() => h.flash('Noted. You will be the first told when renting opens.')}
                className="btn btn-primary"
              >
                Tell me when it opens
              </button>
            </div>
          </div>
        )}

        {/* wanted list */}
        {h.tab === 'wanted' && (
          <div style={{ padding: '14px 16px 0' }}>
            <p style={{ fontSize: 12, opacity: 0.65, margin: '0 0 12px', textWrap: 'pretty' }}>
              This is the board in reverse: say what you are looking for, and the board stays useful even when the
              shelves are empty.
            </p>

            {h.wanted.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-divider)' }}>
                {h.wanted.map((w) => (
                  <div
                    key={w.id}
                    style={{ background: 'var(--color-bg)', padding: '12px 0', display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15 }}>{w.title}</div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                        {w.who} · {w.handoffs} handoffs · {w.ago}
                      </div>
                    </div>
                    <button onClick={() => h.offerWanted(w)} className="btn btn-secondary" style={{ flex: 'none' }}>
                      I have one
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, opacity: 0.6, textWrap: 'pretty' }}>
                Nobody has asked for anything yet. Say what you need and the board works for you.
              </div>
            )}

            {/* compose a wanted post */}
            <div className="field" style={{ marginTop: 16 }}>
              <label>What do you need?</label>
              <input
                className="input"
                placeholder="Box fan — under $15"
                value={h.wantedDraft}
                onChange={(e) => h.setWantedDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') h.postWanted()
                }}
              />
            </div>
            <button
              onClick={h.postWanted}
              disabled={!h.wantedDraft.trim()}
              className="btn btn-primary"
              style={{ marginTop: 8, opacity: h.wantedDraft.trim() ? 1 : 0.45 }}
            >
              Post what you need
            </button>
          </div>
        )}

        {/* the items themselves */}
        {h.tab !== 'wanted' && kind !== 'rent' && (
          <>
            {h.loadingBoard ? (
              <div style={{ padding: '24px 16px', fontSize: 13, opacity: 0.55 }}>Loading the board…</div>
            ) : cards.length === 0 ? (
              <EmptyBoard h={h} />
            ) : (
              <div className="board-grid" style={{ padding: '16px 16px 0', display: 'grid', gap: 14 }}>
                {cards.map((it) => (
                  <ItemCard key={it.id} it={it} h={h} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <TabBar h={h} />
    </div>
  )
}

function EmptyBoard({ h }: { h: Barter }) {
  const searching = h.q.trim().length > 0
  return (
    <div style={{ padding: '32px 16px 0' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20, lineHeight: 1.15 }}>
        {searching ? 'Nothing matches that.' : 'Nothing here yet.'}
      </div>
      <p style={{ fontSize: 13.5, opacity: 0.65, margin: '8px 0 16px', textWrap: 'pretty' }}>
        {searching
          ? 'Try a shorter word, or save it as a search and get pinged when one shows up.'
          : 'The Marketplace fills up when someone posts.'}
      </p>
      {!searching && (
        <button onClick={h.startPost} className="btn btn-primary">
          List the first item
        </button>
      )}
    </div>
  )
}

function ItemCard({ it, h }: { it: Item; h: Barter }) {
  const isGone = h.gone.includes(it.id)
  const kind = h.kindOf(it)
  const mark = KIND_MARK[kind] ?? KIND_MARK.sale
  return (
    <div onClick={() => h.openDetail(it.id)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <Photo url={it.photoUrl} category={it.cat} caption={[it.cat, it.loc].filter(Boolean).join(' · ')} height={118}>
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
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: '.1em',
            }}
          >
            GONE
          </div>
        )}
      </Photo>
      {it.helpWanted && (
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--color-accent-700)',
            background: 'var(--color-accent-100)',
            borderRadius: 999,
            padding: '2px 8px',
            alignSelf: 'flex-start',
          }}
        >
          Needs a hand{it.helpFee ? ` · $${it.helpFee}` : ''}
        </div>
      )}
      {/* Tessa's card, 28 Aug: how it moves, what it is, when and who, where.
          The kind is a colour so a category can show every kind at once. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '.09em',
            color: mark.fg,
            background: mark.bg,
            borderRadius: 3,
            padding: '2px 6px',
            flex: 'none',
          }}
        >
          {mark.label}
        </span>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13, color: 'var(--color-accent-700)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {kind === 'free' ? '' : h.priceOf(it)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--color-accent-700)', marginTop: 1 }}>
          <CategoryIcon category={it.cat} size={14} />
        </span>
        <div style={{ fontSize: 13, lineHeight: 1.25 }}>{it.title}</div>
      </div>
      <div style={{ fontSize: 10.5, opacity: 0.55 }}>
        {it.ago}
        {it.seller ? ` by ${it.seller}` : ''}
      </div>
      <div style={{ fontSize: 10.5, opacity: 0.55 }}>
        {(() => {
          const km = h.distanceOf(it)
          const where = it.spot || it.loc || 'On campus'
          // Beyond a few km the viewer is not on campus at all — off-campus at
          // the weekend, or a location shared from home. A distance then
          // measures the wrong thing and reads as a bug, so drop it and let the
          // meetup spot do the work.
          if (km == null || km > 3) return where
          if (km < 0.15) return `${where} · a couple of minutes away`
          if (km < 1) return `${where} · about ${Math.round(km * 1000)} m`
          return `${where} · about ${km.toFixed(1)} km`
        })()}
      </div>
    </div>
  )
}
