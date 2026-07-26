import { Switch } from '../components/Switch'
import { TabBar } from '../components/TabBar'
import { ITEMS, ME } from '../data/seed'
import type { Item } from '../data/types'
import type { Handoff } from '../lib/useHandoff'

/** Me — tab 5. Identity, the day-7 decisions, paused items, listings, toggles. */
export function Me({ h }: { h: Handoff }) {
  const staleMine = [ITEMS[6], ITEMS[7]].filter((it) => h.isStale(it))
  const paused = [ITEMS[7]].filter((it) => h.isPaused(it))
  const mine: Item[] = h.extra.concat([ITEMS[1], ITEMS[7]])

  return (
    <div className="screen">
      <div style={{ padding: '60px 16px 10px', borderBottom: '2px solid var(--color-divider)', display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 19 }}>Me</div>
        <button onClick={h.jumpBrowse} className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: 12 }}>
          Board
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 30 }}>
        {/* identity */}
        <div style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start', borderBottom: '2px solid var(--color-divider)' }}>
          <div
            style={{
              width: 54,
              height: 54,
              flex: 'none',
              background: 'var(--color-neutral-300)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 19,
              color: 'var(--color-neutral-800)',
            }}
          >
            {ME.initials}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 19 }}>{ME.name}</div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
              {ME.email} · joined {ME.since}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="tag tag-accent">{ME.handoffs} handoffs</span>
              <span className="tag tag-neutral">{ME.noShows} no-shows</span>
              <span className="tag tag-outline">{ME.building}</span>
            </div>
          </div>
        </div>

        {/* needs a decision (day-7) */}
        {staleMine.length > 0 && (
          <div style={{ padding: 16, borderBottom: '2px solid var(--color-divider)' }}>
            <h6 style={{ margin: '0 0 10px', color: 'var(--color-accent-700)' }}>Needs a decision</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {staleMine.map((it) => {
                const showFree = !h.isFree(it)
                return (
                  <div key={it.id} style={{ border: '2px solid var(--color-text)', padding: '12px 13px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, lineHeight: 1.15 }}>{it.title}</div>
                    <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginTop: 5 }}>
                      {h.daysOf(it)} days on the board · {h.isFree(it) ? 'free' : h.priceOf(it)}
                    </div>
                    <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 6, textWrap: 'pretty' }}>
                      {h.isFree(it)
                        ? 'Nobody has claimed it. Confirm it is still there or clear it.'
                        : 'Two people asked, nobody came. Dropping to free moves it in a day.'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      <button onClick={() => h.confirmStill(it.id)} className="btn btn-primary">
                        Still here
                      </button>
                      {showFree && (
                        <button onClick={() => h.makeFree(it.id)} className="btn btn-secondary">
                          Make it free
                        </button>
                      )}
                      <button onClick={() => h.markGoneStale(it.id)} className="btn btn-secondary">
                        It is gone
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11.5, opacity: 0.6, margin: '12px 0 0', textWrap: 'pretty' }}>
              Every listing gets this check on day 7. No answer in 48 hours and it pauses itself, so nothing sits on the
              board rotting.
            </p>
          </div>
        )}

        {/* paused */}
        {paused.length > 0 && (
          <div style={{ padding: 16, borderBottom: '2px solid var(--color-divider)' }}>
            <h6 style={{ margin: '0 0 10px' }}>Paused</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-divider)' }}>
              {paused.map((it) => (
                <div key={it.id} style={{ background: 'var(--color-bg)', padding: '11px 0', display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.75 }}>{it.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.55 }}>Paused after {h.daysOf(it)} days · no reply to the day-7 check</div>
                  </div>
                  <button onClick={() => h.relist(it.id)} className="btn btn-secondary" style={{ flex: 'none', fontSize: 12 }}>
                    Relist
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* my listings */}
        <div style={{ padding: 16 }}>
          <h6 style={{ margin: '0 0 10px' }}>My listings</h6>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-divider)' }}>
            {mine.map((it) => {
              const isGone = h.gone.includes(it.id)
              const stat = isGone
                ? 'Gone · handed off in the lobby'
                : h.isPaused(it)
                  ? 'Paused · hidden from the board'
                  : h.isFree(it)
                    ? 'Free · 4 people asked'
                    : '$' + it.price + ' · 2 people asked'
              return (
                <div key={it.id} style={{ background: 'var(--color-bg)', padding: '11px 0', display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div className="hatch-sm" style={{ width: 40, height: 40, flex: 'none', border: '1px solid var(--color-divider)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{it.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{stat}</div>
                  </div>
                  <button onClick={() => h.toggleGone(it.id, isGone)} className="btn btn-secondary" style={{ flex: 'none', fontSize: 12 }}>
                    {isGone ? 'Relist' : 'Mark as gone'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* saved searches */}
        <div style={{ padding: '0 16px 16px' }}>
          <h6 style={{ margin: '0 0 10px' }}>Saved searches</h6>
          <div style={{ border: '2px solid var(--color-divider)', padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15 }}>“desk lamp” under $20</div>
              <div style={{ fontSize: 11.5, opacity: 0.62, marginTop: 2 }}>Pings you the second one is posted anywhere on campus.</div>
            </div>
            <Switch on={h.alerts} onToggle={() => h.setAlerts(!h.alerts)} />
          </div>
        </div>

        {/* move-out mode */}
        <div style={{ padding: '0 16px 16px' }}>
          <h6 style={{ margin: '0 0 10px' }}>Move-out mode</h6>
          <div style={{ border: '2px solid var(--color-divider)', padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15 }}>May 12–19</div>
              <div style={{ fontSize: 11.5, opacity: 0.62, marginTop: 2 }}>Bulk posting, everything priced $5 or free, one tap per item.</div>
            </div>
            <Switch on={h.moveOut} onToggle={() => h.setMoveOut(!h.moveOut)} />
          </div>
        </div>

        {/* re-verification note */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ borderTop: '2px solid var(--color-divider)', paddingTop: 14, fontSize: 11.5, opacity: 0.6, textWrap: 'pretty' }}>
            We cannot tell who has graduated — only whether your school email still logs in. Re-verify once a term with
            one tap. If the login stops working the account goes read-only, and your handoff count is waiting if you come
            back for grad school.
          </div>
        </div>
      </div>

      <TabBar h={h} />
    </div>
  )
}
