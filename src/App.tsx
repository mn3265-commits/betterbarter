import { useCallback, useEffect, useMemo, useState } from 'react'
import { About } from './site/About'
import { Ops } from './site/Ops'
import { Landing } from './site/Landing'
import { AppRail } from './components/AppRail'
import { IOSDevice } from './components/IOSDevice'
import { Toast } from './components/Toast'
import { Notes } from './Notes'
import { useAuth } from './lib/useAuth'
import { useBarter, type Barter, type LiveContext } from './lib/useBarter'
import { Board } from './screens/Board'
import { Chat } from './screens/Chat'
import { Chats } from './screens/Chats'
import { Claim } from './screens/Claim'
import { Detail } from './screens/Detail'
import { Gate } from './screens/Gate'
import { Me } from './screens/Me'
import { Post1 } from './screens/Post1'
import { Post2 } from './screens/Post2'
import { Posted } from './screens/Posted'
import { Rules } from './screens/Rules'
import { HowItWorks } from './screens/HowItWorks'

const CONFIG = { moveOutBanner: false, defaultTab: 'free' as const }

function CurrentScreen({ h }: { h: Barter }) {
  switch (h.screen) {
    case 'rules':
      return <Rules mode="read" campus={h.campusName} onClose={h.jumpMe} />
    case 'how':
      return <HowItWorks onDone={h.jumpMe} doneLabel="Done" />
    case 'gate':
      return <Gate h={h} />
    case 'browse':
      return <Board h={h} />
    case 'detail':
      return <Detail h={h} />
    case 'claim':
      return <Claim h={h} />
    case 'chat':
      return <Chat h={h} />
    case 'chats':
      return <Chats h={h} />
    case 'post1':
      return <Post1 h={h} />
    case 'post2':
      return <Post2 h={h} />
    case 'posted':
      return <Posted h={h} />
    case 'me':
      return <Me h={h} />
  }
}

/** Full-bleed accent splash while the session resolves. */
function Splash() {
  return (
    <div
      className="screen"
      style={{ background: 'var(--color-accent)', color: 'var(--color-bg)', padding: '74px 26px 46px' }}
    >
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 60, lineHeight: 1.02, letterSpacing: '-.015em' }}>
        BetterBarter
      </div>
    </div>
  )
}

/** Signed in, but no profile row: the email domain is not an enrolled campus. */
function NotEnrolled({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  return (
    <div
      className="screen"
      style={{ background: 'var(--color-accent)', color: 'var(--color-bg)', padding: '74px 26px 46px' }}
    >
      <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', opacity: 0.85 }}>
        School email required
      </div>
      <div style={{ height: 2, background: 'var(--color-bg)', opacity: 0.5, margin: '14px 0 22px' }} />
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 34, lineHeight: 1.05 }}>
        That account is not on a campus we run yet.
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.4, margin: '18px 0 0', maxWidth: '28ch' }}>
        {email ? <b>{email}</b> : 'That address'} is not a verified school email for an enrolled campus. BetterBarter is
        trialing at Columbia — sign in with your <b>@columbia.edu</b> account.
      </p>
      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={onSignOut}
          style={{
            border: 0,
            background: 'var(--color-bg)',
            color: 'var(--color-accent-700)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 16,
            padding: '16px 18px',
            textAlign: 'left',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Use a different account
        </button>
      </div>
    </div>
  )
}

function LiveApp() {
  const auth = useAuth()
  const p = auth.profile

  const live: LiveContext | undefined = useMemo(
    () =>
      p
        ? {
            userId: p.id,
            campusId: p.campus_id,
            name: p.name,
            email: p.email,
            building: p.building,
            preferredSpot: p.preferred_spot,
            lat: p.approx_lat,
            lng: p.approx_lng,
            handoffs: p.handoffs,
            carries: p.carries,
            pronouns: p.pronouns,
            about: p.about,
            noShows: p.no_shows,
            joinedAt: p.joined_at,
            refreshProfile: auth.refreshProfile,
            signOut: auth.signOut,
          }
        : undefined,
    [p, auth.refreshProfile, auth.signOut],
  )

  const h = useBarter(CONFIG, live)

  // The installed app's "Post something" shortcut opens on /app?post=1.
  const wantsPost = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('post')
  const [tookShortcut, setTookShortcut] = useState(false)
  useEffect(() => {
    if (!wantsPost || tookShortcut || !p) return
    setTookShortcut(true)
    h.startPost()
    window.history.replaceState(null, '', '/app')
  }, [wantsPost, tookShortcut, p, h])

  // The walkthrough is a first-run courtesy, not a record — local is the right
  // place for it. The rules agreement is not: that lives on the account.
  const howKey = p ? `handoff:how:${p.id}` : null
  const [seenHow, setSeenHow] = useState(() =>
    howKey ? localStorage.getItem(howKey) === 'yes' : true,
  )
  const markHowSeen = useCallback(() => {
    if (howKey) localStorage.setItem(howKey, 'yes')
    setSeenHow(true)
  }, [howKey])

  let body: React.ReactNode
  if (auth.loading) body = <Splash />
  else if (!auth.session) body = <Gate h={h} auth={auth} />
  else if (!p) body = <NotEnrolled email={auth.email} onSignOut={() => void auth.signOut()} />
  else if (h.rulesLoading) body = <Splash />
  else if (!h.rulesAccepted)
    body = <Rules mode="accept" campus={h.campusName} onAccept={h.acceptRules} />
  else if (!seenHow) body = <HowItWorks onDone={markHowSeen} />
  else body = <CurrentScreen h={h} />

  // The rail is navigation, so it appears only once there is something to
  // navigate: not on the splash, the sign-in gate, the rules or the walkthrough.
  const inApp = Boolean(!auth.loading && auth.session && p && !h.rulesLoading && h.rulesAccepted && seenHow)

  return (
    <div className={'app-frame' + (inApp ? ' has-rail' : '')}>
      {inApp && <AppRail h={h} />}
      {/* The screen name reaches CSS so the desktop layout can let the board
          spread while keeping reading and typing screens at a column width. */}
      <div className="app-viewport" data-screen={h.screen}>
        {body}
        <Toast text={h.toast} />
      </div>
    </div>
  )
}

/** The design-reference presentation: phone frame + rationale column, always on
 *  seed data so the whole flow is walkable without an account. */
function Showcase() {
  const h = useBarter({ moveOutBanner: true, defaultTab: 'free' })
  return (
    <div className="stage">
      <Notes h={h} />
      <div style={{ flex: 'none' }}>
        <IOSDevice>
          <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <CurrentScreen h={h} />
            <Toast text={h.toast} />
          </div>
        </IOSDevice>
      </div>
    </div>
  )
}

/** The product lives under /app; everything else is the public site. */
function isAppPath(pathname: string): boolean {
  return pathname === '/app' || pathname.startsWith('/app/')
}

export default function App() {
  if (typeof window === 'undefined') return null

  const { search, pathname, hash } = window.location
  const showcase = new URLSearchParams(search).has('showcase')
  if (showcase) return <Showcase />

  // A sign-in link resolves against the site URL, which is the landing page.
  // Carry the token hash over to the app rather than dropping the session on
  // the floor — this also covers links sent before /app existed.
  if (!isAppPath(pathname) && hash.includes('access_token')) {
    window.location.replace('/app' + hash)
    return null
  }

  if (pathname === '/about' || pathname === '/about/') return <About />
  // The founders' dashboard. Gated in the database, not here — this route only
  // decides which screen to draw.
  if (pathname === '/ops' || pathname === '/ops/') return <Ops />
  if (!isAppPath(pathname)) return <Landing />

  return (
    <div className="app-shell">
      <LiveApp />
    </div>
  )
}
