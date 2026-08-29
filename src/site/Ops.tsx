import { useEffect, useState } from 'react'
import { categoryColor } from '../components/CategoryIcon'
import {
  fetchFounderMetrics,
  fetchModerationQueue,
  fetchHandoffIntegrity,
  fetchReclaimQueue,
  reclaimPhotos,
  setReportStatus,
  type FounderMetrics,
  type HandoffIntegrity,
  type ModerationRow,
  type ReclaimRow,
} from '../lib/api'
import { impactOf, co2eLabel, kgLabel } from '../lib/impact'
import { useAuth } from '../lib/useAuth'
import { SiteFooter } from './SiteChrome'
import '../styles/site.css'
import '../styles/ops.css'

/**
 * The founders' dashboard.
 *
 * Read it top-down: the four numbers that decide whether this is working, then
 * the fourteen days behind them, then the composition, then the campuses. It is
 * scanned rather than read, so state is in the shape as well as the number —
 * and it deliberately shows counts only. Even a founder does not get to browse
 * another campus's board from here.
 */
export function Ops() {
  const auth = useAuth()
  const [m, setM] = useState<FounderMetrics | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading')
  const [queue, setQueue] = useState<ModerationRow[]>([])
  const [orphans, setOrphans] = useState<ReclaimRow[]>([])
  const [integrity, setIntegrity] = useState<HandoffIntegrity | null>(null)
  const [reclaiming, setReclaiming] = useState(false)

  useEffect(() => {
    if (auth.loading) return
    if (!auth.session) {
      setState('denied')
      return
    }
    let cancelled = false
    fetchFounderMetrics()
      .then((data) => {
        if (cancelled) return
        if (!data) setState('denied')
        else {
          setM(data)
          setState('ok')
          fetchModerationQueue().then(setQueue).catch(() => {})
          fetchReclaimQueue().then(setOrphans).catch(() => {})
          fetchHandoffIntegrity().then(setIntegrity).catch(() => {})
        }
      })
      .catch(() => !cancelled && setState('denied'))
    return () => {
      cancelled = true
    }
  }, [auth.loading, auth.session])

  if (state === 'loading') {
    return (
      <div className="ops">
        <div className="site__wrap ops__head">
          <div className="site__kicker">Internal</div>
          <h1>Loading…</h1>
        </div>
      </div>
    )
  }

  if (state === 'denied' || !m) {
    return (
      <div className="ops">
        <div className="site__wrap ops__head">
          <div className="site__kicker">Internal</div>
          <h1>Founders only</h1>
          <p className="ops__lede">
            This page reads across every campus, so it is gated to founder accounts. Sign in with one, or{' '}
            <a href="/app">open the board</a> instead.
          </p>
        </div>
        <SiteFooter />
      </div>
    )
  }

  // The impact figures a founder would otherwise compute by hand, from the same
  // model the public site publishes.
  const impact = impactOf(
    Object.fromEntries(
      Object.entries(m.byCategory).map(([cat, n]) => [cat, m.listings ? (n / m.listings) * m.handoffs : 0]),
    ),
  )

  const dayMax = Math.max(1, ...m.daily.map((d) => Math.max(d.signups, d.listings, d.handoffs)))
  const kinds = Object.entries(m.byKind).sort((a, b) => b[1] - a[1])
  const cats = Object.entries(m.byCategory).sort((a, b) => b[1] - a[1])
  const catMax = Math.max(1, ...cats.map(([, n]) => n))

  const conversion = m.listings ? Math.round((m.handoffs / m.listings) * 100) : 0
  const claimed = m.listings ? Math.round((m.threads / m.listings) * 100) : 0

  return (
    <div className="ops">
      <div className="site__wrap ops__head">
        <div className="site__kicker">Internal · founders</div>
        <h1>How it is actually going</h1>
        <p className="ops__lede">
          Counts across every campus, live. No names, no listings, no messages — the database returns aggregates and
          nothing else, even to us.
        </p>
      </div>

      <div className="site__wrap">
        {/* the four that decide whether this works */}
        <div className="ops__kpis">
          <div className="kpi">
            <b>{m.handoffs}</b>
            <span>confirmed handoffs</span>
            <i>the only number that is measured</i>
          </div>
          <div className="kpi">
            <b>{m.listingsLive}</b>
            <span>live listings</span>
            <i>{m.listings} posted in total</i>
          </div>
          <div className="kpi">
            <b>{m.accounts}</b>
            <span>accounts</span>
            <i>across {m.campuses} {m.campuses === 1 ? 'campus' : 'campuses'}</i>
          </div>
          <div className="kpi">
            <b>{conversion}%</b>
            <span>listings handed off</span>
            <i>{claimed}% were claimed at all</i>
          </div>
        </div>

        {/* fourteen days */}
        <section className="ops__block">
          <h2>The last fourteen days</h2>
          <div className="spark">
            {m.daily.map((d) => (
              <div className="spark__day" key={d.day} title={`${d.day} · ${d.signups} signups · ${d.listings} listings · ${d.handoffs} handoffs`}>
                <div className="spark__stack">
                  <div className="spark__bar spark__bar--handoff" style={{ height: (d.handoffs / dayMax) * 100 + '%' }} />
                  <div className="spark__bar spark__bar--listing" style={{ height: (d.listings / dayMax) * 100 + '%' }} />
                  <div className="spark__bar spark__bar--signup" style={{ height: (d.signups / dayMax) * 100 + '%' }} />
                </div>
                <span>{d.day.slice(8)}</span>
              </div>
            ))}
          </div>
          <div className="ops__key">
            <span><i style={{ background: 'var(--color-accent)' }} /> Handoffs</span>
            <span><i style={{ background: 'var(--color-accent-400)' }} /> Listings</span>
            <span><i style={{ background: 'var(--color-signal)' }} /> Signups</span>
          </div>
        </section>

        <div className="ops__two">
          <section className="ops__block">
            <h2>How things are listed</h2>
            <div className="ops__rows">
              {kinds.length === 0 && <p className="ops__empty">Nothing posted yet.</p>}
              {kinds.map(([kind, n]) => (
                <div className="row" key={kind}>
                  <span className="row__label">{kind}</span>
                  <span className="row__track">
                    <span className="row__fill" style={{ width: (n / Math.max(1, m.listings)) * 100 + '%' }} />
                  </span>
                  <span className="row__val">{n}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="ops__block">
            <h2>What is being posted</h2>
            <div className="ops__rows">
              {cats.length === 0 && <p className="ops__empty">Nothing posted yet.</p>}
              {cats.map(([cat, n]) => (
                <div className="row" key={cat}>
                  <span className="row__label">{cat}</span>
                  <span className="row__track">
                    <span className="row__fill" style={{ width: (n / catMax) * 100 + '%', background: categoryColor(cat) }} />
                  </span>
                  <span className="row__val">{n}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* what the carbon number is actually built on */}
        {integrity && (
          <section className="ops__block">
            <h2>Evidence</h2>
            <div className="ops__stair">
              <div className="stair">
                <div className="stair__n">{integrity.verified}</div>
                <div className="stair__label">Verified in person</div>
                <div className="stair__sub">two halves of a code, joined</div>
              </div>
              <div className="stair">
                <div className="stair__n">{integrity.onTrust}</div>
                <div className="stair__label">On trust</div>
                <div className="stair__sub">both tapped, nothing proved</div>
              </div>
              <div className="stair">
                <div className="stair__n">{integrity.openCodes}</div>
                <div className="stair__label">Codes waiting</div>
                <div className="stair__sub">handoffs not yet made</div>
              </div>
              <div className="stair">
                <div className="stair__n">{integrity.badTries}</div>
                <div className="stair__label">Wrong tries</div>
                <div className="stair__sub">
                  {integrity.lockedOut > 0 ? `${integrity.lockedOut} locked out` : 'none locked out'}
                </div>
              </div>
            </div>
            <p className="ops__note">
              Only the first column is evidence. Six digits split between two phones cannot be put together
              without both people being there, so that count is the one to quote — and the one the impact
              figure should be built on as soon as there is enough of it.
            </p>
          </section>
        )}

        {/* the lifecycle — and the only storage that actually costs anything */}
        <section className="ops__block">
          <h2>Lifecycle</h2>
          <div className="ops__stair">
            {([
              ['On the board', m.listingsLive, 'active'],
              ['Paused', m.listingsPaused, 'day 9, no answer'],
              ['Archived', m.listingsArchived, 'day 30, off the shelf'],
              ['Handed off', m.listingsGone, 'the point of all this'],
            ] as const).map(([label, n, sub]) => (
              <div key={label} className="stair">
                <div className="stair__n">{n}</div>
                <div className="stair__label">{label}</div>
                <div className="stair__sub">{sub}</div>
              </div>
            ))}
          </div>

          <table className="ops__table">
            <tbody>
              <tr>
                <td>Accounts off the board by choice</td>
                <td className="num">{m.deactivated}</td>
              </tr>
              <tr>
                <td>Not seen in 90 days <span className="ops__hint">(shown, never acted on — this product is seasonal)</span></td>
                <td className="num">{m.dormant90}</td>
              </tr>
              <tr>
                <td>Orphaned photos waiting to be released</td>
                <td className="num">{m.photosQueued}</td>
              </tr>
            </tbody>
          </table>

          {orphans.length > 0 && (
            <div className="ops__reclaim">
              <p>
                {orphans.length} photo{orphans.length === 1 ? '' : 's'} belong to listings that aged out. The database
                cannot reach into object storage, so this is the one button that has to be pressed by a person.
              </p>
              <button
                className="btn btn-primary"
                disabled={reclaiming}
                onClick={() => {
                  setReclaiming(true)
                  void reclaimPhotos(orphans)
                    .then(() => Promise.all([fetchReclaimQueue(), fetchFounderMetrics()]))
                    .then(([left, fresh]) => {
                      setOrphans(left)
                      if (fresh) setM(fresh)
                    })
                    .finally(() => setReclaiming(false))
                }}
              >
                {reclaiming ? 'Releasing…' : `Release ${orphans.length} photo${orphans.length === 1 ? '' : 's'}`}
              </button>
            </div>
          )}
        </section>

        {/* moderation: the one place a founder sees a person rather than a count */}
        <section className="ops__block">
          <h2>
            Reports{' '}
            {m.reportsOpen > 0 && <span className="ops__badge">{m.reportsOpen} open</span>}
          </h2>
          {queue.length === 0 ? (
            <p className="ops__empty">
              Nothing reported. {m.blocks > 0 ? `${m.blocks} block${m.blocks === 1 ? '' : 's'} in place.` : ''}
            </p>
          ) : (
            <div className="ops__reports">
              {queue.map((r) => (
                <div key={r.id} className={'report report--' + r.status}>
                  <div className="report__head">
                    <b>{r.subject_name}</b>
                    <span className="report__reason">{r.reason.replace(/_/g, ' ')}</span>
                    <span className="report__meta">
                      {r.campus} · reported by {r.reporter_name} · {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.note && <p className="report__note">“{r.note}”</p>}
                  <div className="report__meta">
                    {r.times_reported} report{r.times_reported === 1 ? '' : 's'} against this account ·{' '}
                    {r.subject_listings} listing{r.subject_listings === 1 ? '' : 's'}
                  </div>
                  <div className="report__actions">
                    {(['reviewed', 'actioned', 'dismissed'] as const).map((next) => (
                      <button
                        key={next}
                        className={'btn ' + (r.status === next ? 'btn-primary' : 'btn-secondary')}
                        onClick={() => {
                          void setReportStatus(r.id, next).then(() =>
                            fetchModerationQueue().then(setQueue).catch(() => {}),
                          )
                        }}
                      >
                        {next}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="ops__block">
          <h2>Impact, on the published model</h2>
          <div className="ops__kpis ops__kpis--small">
            <div className="kpi"><b>{impact.items.toFixed(0)}</b><span>objects kept in use</span><i>measured</i></div>
            <div className="kpi"><b>{kgLabel(impact.kg)}</b><span>mass</span><i>estimated</i></div>
            <div className="kpi"><b>{co2eLabel(impact.co2e)}</b><span>production avoided</span><i>displacement 0.5</i></div>
            <div className="kpi"><b>{m.carries}</b><span>carries</span><i>{m.carryOffers} offers made</i></div>
          </div>
        </section>

        <div className="ops__two">
          <section className="ops__block">
            <h2>Campuses</h2>
            <table className="ops__table">
              <thead>
                <tr><th>Campus</th><th>Accounts</th><th>Listings</th><th>Handoffs</th></tr>
              </thead>
              <tbody>
                {m.byCampus.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td className="num">{c.accounts}</td>
                    <td className="num">{c.listings}</td>
                    <td className="num">{c.handoffs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="ops__block">
            <h2>Health</h2>
            <table className="ops__table">
              <tbody>
                <tr><td>Messages sent</td><td className="num">{m.messages}</td></tr>
                <tr><td>Listings with a photo</td><td className="num">{m.photos} / {m.listings}</td></tr>
                <tr><td>Accounts sharing location</td><td className="num">{m.withLocation} / {m.accounts}</td></tr>
                <tr><td>Ratings</td><td className="num">{m.ratingCount}{m.ratingAvg ? ` · ${m.ratingAvg} avg` : ''}</td></tr>
                <tr><td>Wanted posts</td><td className="num">{m.wanted}</td></tr>
                <tr><td>Threads opened</td><td className="num">{m.threads}</td></tr>
                <tr><td>Reports · blocks</td><td className="num">{m.reportsTotal} · {m.blocks}</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
