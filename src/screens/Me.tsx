import { useEffect, useState } from 'react'
import { Photo } from '../components/Photo'
import { Switch } from '../components/Switch'
import { TabBar } from '../components/TabBar'
import { averageItem, co2eLabel } from '../lib/impact'
import { SUPPORT_EMAIL } from '../lib/rules'
import { AppBody, AppHeader } from '../components/Shell'
import type { Barter } from '../lib/useBarter'

/** Me — tab 5. Identity, the day-7 decisions, paused items, listings, toggles. */
export function Me({ h }: { h: Barter }) {
  const staleMine = h.staleListings
  const paused = h.pausedListings
  const archived = h.archivedListings
  const [leaving, setLeaving] = useState(false)
  const mine = h.myListings

  /* Tessa's Impact Dashboard, 28 Aug — split by what actually happened rather
     than one blended "handoffs" number. The counts are measured; the emissions
     figure is the published model and still says so. */
  const done = mine.filter((it) => it.status === 'gone')
  const givenFree = done.filter((it) => h.kindOf(it) === 'free').length

  const [name, setName] = useState(h.me.name)
  const [spot, setSpot] = useState(h.me.preferredSpot)
  const [pronouns, setPronouns] = useState(h.me.pronouns)
  const [about, setAbout] = useState(h.me.about)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setName(h.me.name)
    setSpot(h.me.preferredSpot)
    setPronouns(h.me.pronouns)
    setAbout(h.me.about)
  }, [h.me.name, h.me.preferredSpot, h.me.pronouns, h.me.about])

  // The one thing a new account is asked for. Not where they live — where they
  // are happy to meet.
  const needsSpot = h.live && !h.me.preferredSpot

  function saveProfile() {
    if (name.trim() && name.trim() !== h.me.name) h.setDisplayName(name)
    if (spot.trim() !== h.me.preferredSpot) h.setPreferredSpot(spot)
    if (pronouns !== h.me.pronouns || about !== h.me.about) h.saveProfileDetails({ pronouns, about })
    setEditing(false)
  }

  return (
    <div className="screen">
      <AppHeader
        title="Profile"
        action={
          <button onClick={h.jumpBrowse} className="btn btn-ghost" data-rail-dupe="1" style={{ fontSize: 12 }}>
            Board
          </button>
        }
      />

      <AppBody pad={false}>
        {/* identity */}
        <div style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start', borderBottom: '1px solid var(--color-divider)' }}>
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
              fontWeight: 600,
              fontSize: 19,
              color: 'var(--color-neutral-800)',
            }}
          >
            {h.me.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 19 }}>{h.me.name}</div>
            {h.me.pronouns && <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 1 }}>{h.me.pronouns}</div>}
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2, wordBreak: 'break-all' }}>
              {h.me.email}
              {h.me.since ? ` · joined ${h.me.since}` : ''}
            </div>
            {/* The campus this account belongs to, as its own institution shows
                itself: name and mark, both read from the campus row. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
              {h.campusLogo && (
                <img
                  src={h.campusLogo}
                  alt=""
                  width={22}
                  height={22}
                  style={{ borderRadius: 5, flex: 'none' }}
                  onError={(e) => ((e.currentTarget.style.display = 'none'))}
                />
              )}
              {/* Tessa, 31 Aug: no email on a page every member can see. Joined
                  date and rating are the two things that say "this is a real
                  person who has been here a while". */}
              <div style={{ fontSize: 12.5, opacity: 0.62 }}>
                {h.me.since ? `Joined ${h.me.since}` : 'New here'}
              </div>
            </div>
            {/* Tessa, 30 Aug: the campus line, the handoff count and the
                no-show count all came off. The counts live in the Impact
                Dashboard below, and saying them twice made a profile that is
                mostly numbers about a person. Rating stays — it is the one that
                is about how they behave. */}
            {(h.me.rating != null || h.me.carries > 0) && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {h.me.rating != null && (
                  <span
                    className="tag"
                    style={{ background: 'var(--color-signal-100)', color: 'var(--color-signal-700)' }}
                  >
                    {h.me.rating.toFixed(1)} ★ · {h.me.ratings}
                  </span>
                )}
                {h.me.carries > 0 && <span className="tag tag-neutral">{h.me.carries} carries</span>}
              </div>
            )}
            {h.me.about && (
              <p style={{ fontSize: 13, opacity: 0.78, margin: '9px 0 0', lineHeight: 1.45, textWrap: 'pretty' }}>
                {h.me.about}
              </p>
            )}
            {h.live && (
              <button onClick={() => setEditing((v) => !v)} className="btn btn-ghost" style={{ fontSize: 12, marginTop: 8, paddingInline: 0 }}>
                {editing ? 'Cancel' : 'Edit profile'}
              </button>
            )}
          </div>
        </div>

        {/* What those handoffs add up to. The count is measured; the two numbers
            beside it are estimates from the published model, and say so. */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--color-divider)' }}>
          <h6 style={{ margin: '0 0 10px' }}>Individual Impact Dashboard</h6>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--color-divider)', border: '1px solid var(--color-divider)' }}>
            {[
              [String(h.me.handoffs), 'meet-ups', 'measured'],
              [String(givenFree), 'items given away for free', 'measured'],
              [co2eLabel(averageItem().co2e * h.me.handoffs), 'emissions avoided', 'estimated'],
            ].map(([big, label, kind]) => (
              <div key={label} style={{ background: 'var(--color-bg)', padding: '10px 11px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 18, letterSpacing: '-.02em' }}>{big}</div>
                <div style={{ fontSize: 11.5, opacity: 0.7, marginTop: 2 }}>{label}</div>
                <div style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.45, marginTop: 3 }}>{kind}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, opacity: 0.6, margin: '9px 0 0', textWrap: 'pretty' }}>
            Mass and emissions use the published category model at a displacement rate of 0.5 — the method is on{' '}
            <a href="/#impact">the site</a>.
          </p>
        </div>

        {/* carrying: the owner's decision, and the carrier's own jobs */}
        {h.live && (h.offersOnMine.length > 0 || h.myCarryOffers.length > 0) && (
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-divider)' }}>
            <h6 style={{ margin: '0 0 10px' }}>Carrying</h6>

            {h.offersOnMine.map((o) => (
              <div
                key={o.id}
                style={{
                  border: '1px solid var(--color-signal)',
                  background: 'var(--color-signal-100)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 13px',
                  marginBottom: 8,
                }}
              >
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15 }}>
                  {o.helperName} can carry {o.listingTitle.toLowerCase()}
                </div>
                <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 3, lineHeight: 1.45 }}>
                  {o.fee ? `$${o.fee} · ` : ''}
                  {o.helperCarries} carries
                  {o.note ? ` · ${o.note}` : ''}
                </div>
                <button onClick={() => h.acceptCarry(o.id)} className="btn btn-primary" style={{ marginTop: 10 }}>
                  Book {o.helperName.split(' ')[0]}
                </button>
              </div>
            ))}

            {h.myCarryOffers.map((o) => (
              <div
                key={o.id}
                style={{
                  border: '1px solid var(--color-divider)',
                  borderRadius: 'var(--radius-md)',
                  padding: '11px 13px',
                  marginBottom: 8,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'baseline',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{o.listingTitle}</div>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>{o.fee ? `You asked $${o.fee}` : 'You offered to help'}</div>
                </div>
                <span
                  className="tag"
                  style={
                    o.status === 'accepted'
                      ? { background: 'var(--color-accent-100)', color: 'var(--color-accent-700)' }
                      : { background: 'var(--color-surface)', color: 'var(--color-text)' }
                  }
                >
                  {o.status === 'accepted' ? 'Booked' : o.status === 'pending' ? 'Waiting' : o.status}
                </span>
              </div>
            ))}

            <p style={{ fontSize: 11.5, opacity: 0.6, margin: '4px 0 0', textWrap: 'pretty' }}>
              Paid directly between the two of you. BetterBarter holds nothing and takes nothing.
            </p>
          </div>
        )}

        {/* location: opt-in, coarse, and reversible */}
        {h.live && (
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-divider)' }}>
            <h6 style={{ margin: '0 0 8px' }}>Distance</h6>
            <p style={{ fontSize: 12.5, opacity: 0.72, margin: '0 0 12px', textWrap: 'pretty' }}>
              {h.hasLocation
                ? 'The board sorts by how close things are. Your position is stored to about 100 metres and is never shown to anyone — other people only ever see a distance.'
                : 'Share an approximate location and the board sorts by how close things are. It is rounded to about 100 metres before it leaves this device, nobody else ever sees it, and you can forget it at any time.'}
            </p>
            {h.hasLocation ? (
              <button onClick={h.forgetLocation} className="btn btn-secondary" style={{ fontSize: 13 }}>
                Forget my location
              </button>
            ) : (
              <button onClick={h.shareLocation} className="btn btn-primary" style={{ fontSize: 13 }}>
                {h.locating ? 'Asking…' : 'Share approximate location'}
              </button>
            )}
          </div>
        )}

        {/* first-run: where you like to meet */}
        {(needsSpot || editing) && (
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-divider)' }}>
            <h6 style={{ margin: '0 0 10px', color: needsSpot ? 'var(--color-accent-700)' : undefined }}>
              {needsSpot ? 'One thing first' : 'Your details'}
            </h6>
            {needsSpot && (
              <p style={{ fontSize: 12.5, opacity: 0.7, margin: '0 0 12px', textWrap: 'pretty' }}>
                Where do you like to hand things over? A library entrance, a dining hall door, a student centre — any
                public place on campus you already pass. It becomes the default on everything you post or claim, and it
                is never where you live.
              </p>
            )}
            <div className="field">
              <label>Your name, as people will see it</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex M." />
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label>Pronouns</label>
              <input
                className="input"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="she/her · he/him · they/them"
              />
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label>About you</label>
              <textarea
                className="input"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="A line or two. What you study, what you are clearing out, anything that makes meeting you easy."
              />
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label>Where you usually meet</label>
              <input
                className="input"
                value={spot}
                onChange={(e) => setSpot(e.target.value)}
                list="hf-spots"
                placeholder="Butler Library entrance"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveProfile()
                }}
              />
            </div>
            <datalist id="hf-spots">
              {h.campusSpots.map((s) => (
                <option key={s.name} value={s.name} />
              ))}
            </datalist>
            <button onClick={saveProfile} className="btn btn-primary" style={{ marginTop: 12 }}>
              Save
            </button>
          </div>
        )}

        {/* needs a decision (day-7) */}
        {staleMine.length > 0 && (
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-divider)' }}>
            <h6 style={{ margin: '0 0 10px', color: 'var(--color-accent-700)' }}>Needs a decision</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {staleMine.map((it) => {
                const showFree = !h.isFree(it)
                return (
                  <div key={it.id} style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-lg)', padding: '12px 13px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 16, lineHeight: 1.15 }}>{it.title}</div>
                    <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginTop: 5 }}>
                      {h.daysOf(it)} days on the board · {h.isFree(it) ? 'free' : h.priceOf(it)}
                    </div>
                    <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 6, textWrap: 'pretty' }}>
                      {h.isFree(it)
                        ? 'Nobody has claimed it. Confirm it is still there or clear it.'
                        : 'Nobody came for it. Dropping to free moves it in a day.'}
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
              Every listing gets this check on day 7. No answer and it pauses itself, so nothing sits on the board
              rotting.
            </p>
          </div>
        )}

        {/* paused */}
        {paused.length > 0 && (
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-divider)' }}>
            <h6 style={{ margin: '0 0 10px' }}>Paused</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-divider)' }}>
              {paused.map((it) => (
                <div key={it.id} style={{ background: 'var(--color-bg)', padding: '11px 0', display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.75 }}>{it.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.55 }}>Paused · hidden from the board</div>
                  </div>
                  <button onClick={() => h.relist(it.id)} className="btn btn-secondary" style={{ flex: 'none', fontSize: 12 }}>
                    Relist
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* archived — a month on the shelf with nothing happening */}
        {archived.length > 0 && (
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-divider)' }}>
            <h6 style={{ margin: '0 0 10px' }}>Archived</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-divider)' }}>
              {archived.map((it) => (
                <div key={it.id} style={{ background: 'var(--color-bg)', padding: '11px 0', display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.6 }}>{it.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>Aged out after a month · photo released</div>
                  </div>
                  <button onClick={() => h.relist(it.id)} className="btn btn-secondary" style={{ flex: 'none', fontSize: 12 }}>
                    Relist
                  </button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11.5, opacity: 0.6, margin: '12px 0 0', textWrap: 'pretty' }}>
              Nothing here is deleted. A month with no answer takes a listing off your shelf and eventually releases its
              photo — relisting brings the listing straight back, and you can add a new photo.
            </p>
          </div>
        )}

        {/* my listings */}
        <div style={{ padding: 16 }}>
          <h6 style={{ margin: '0 0 10px' }}>My listings</h6>
          {mine.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.6, textWrap: 'pretty' }}>
              You have not posted anything yet. A photo and one sentence is the whole thing.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-divider)' }}>
              {mine.map((it) => {
                const isGone = h.gone.includes(it.id)
                const stat = isGone
                  ? 'Gone · handed off'
                  : h.isPaused(it)
                    ? 'Paused · hidden from the board'
                    : h.isFree(it)
                      ? 'Free · on the board'
                      : '$' + it.price + ' · on the board'
                return (
                  <div key={it.id} style={{ background: 'var(--color-bg)', padding: '11px 0', display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 40, height: 40, flex: 'none' }}>
                      <Photo url={it.photoUrl} category={it.cat} height={40} />
                    </div>
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
          )}
        </div>

        {/* saved searches */}
        <div style={{ padding: '0 16px 16px' }}>
          <h6 style={{ margin: '0 0 10px' }}>Saved searches</h6>
          <div style={{ border: '1px solid var(--color-divider)', padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15 }}>Ping me on new posts</div>
              <div style={{ fontSize: 11.5, opacity: 0.62, marginTop: 2 }}>
                Tells you the second something matching lands on the board.
              </div>
            </div>
            <Switch on={h.alerts} onToggle={() => h.setAlerts(!h.alerts)} />
          </div>
        </div>

        {/* move-out mode */}
        <div style={{ padding: '0 16px 16px' }}>
          <h6 style={{ margin: '0 0 10px' }}>Move-out mode</h6>
          <div style={{ border: '1px solid var(--color-divider)', padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15 }}>Move-out week</div>
              <div style={{ fontSize: 11.5, opacity: 0.62, marginTop: 2 }}>
                Puts the move-out banner on the board so the hall empties fast.
              </div>
            </div>
            <Switch on={h.moveOut} onToggle={() => h.setMoveOut(!h.moveOut)} />
          </div>
        </div>

        {/* help */}
        <div style={{ padding: '0 16px 16px' }}>
          <h6 style={{ margin: '0 0 10px' }}>Using BetterBarter</h6>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--color-divider)' }}>
            <button
              onClick={() => h.go('how')}
              style={{ background: 'var(--color-bg)', border: 0, padding: '13px 0', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
            >
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>How BetterBarter works</div>
              <div style={{ fontSize: 11.5, opacity: 0.6 }}>Posting, claiming, and meeting up — in four screens.</div>
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=BetterBarter`}
              style={{ background: 'var(--color-bg)', border: 0, padding: '13px 0', textAlign: 'left', cursor: 'pointer', font: 'inherit', textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>Something went wrong</div>
              <div style={{ fontSize: 11.5, opacity: 0.6 }}>Email a person. If you are in danger, call Public Safety first.</div>
            </a>
            <button
              onClick={() => h.go('rules')}
              style={{ background: 'var(--color-bg)', border: 0, padding: '13px 0', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
            >
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>Community rules</div>
              <div style={{ fontSize: 11.5, opacity: 0.6 }}>What may not be listed, and how to meet safely. You agreed to these.</div>
            </button>
          </div>
        </div>

        {/* account */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 14, fontSize: 11.5, opacity: 0.6, textWrap: 'pretty' }}>
            We cannot tell who has graduated — only whether your school email still logs in. If the login stops working
            the account goes read-only, and your handoff count is waiting if you come back for grad school.
          </div>
          {h.live && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button onClick={h.signOut} className="btn btn-secondary" style={{ fontSize: 13 }}>
                Sign out
              </button>
              <button onClick={() => setLeaving(true)} className="btn btn-secondary" style={{ fontSize: 13, opacity: 0.75 }}>
                Take me off the board
              </button>
            </div>
          )}

          {leaving && (
            <div className="app-sheet" style={{ marginTop: 14 }}>
              <h6 style={{ margin: '0 0 6px' }}>Take me off the board</h6>
              <p style={{ fontSize: 12.5, opacity: 0.75, margin: '0 0 4px', textWrap: 'pretty' }}>
                Your listings come down and nobody can find you. Sign back in whenever you like and it is all still
                here — this is a door, not a trapdoor.
              </p>
              <p style={{ fontSize: 12.5, opacity: 0.75, margin: '0 0 12px', textWrap: 'pretty' }}>
                What stays either way: the handoffs you completed, the ratings you left, and the ones people left you.
                Those are not only yours to erase — a rating you wrote is somebody else's reputation.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={h.deactivateAccount} className="btn btn-primary" style={{ fontSize: 13 }}>
                  Take me off
                </button>
                <button onClick={() => setLeaving(false)} className="btn btn-secondary" style={{ fontSize: 13 }}>
                  Stay
                </button>
              </div>
            </div>
          )}
        </div>
      </AppBody>

      <TabBar h={h} />
    </div>
  )
}
