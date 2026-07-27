import { useCallback, useMemo, useState } from 'react'
import { IOSDevice } from './components/IOSDevice'
import { Toast } from './components/Toast'
import { Notes } from './Notes'
import { useAuth } from './lib/useAuth'
import { useHandoff, type Handoff, type LiveContext } from './lib/useHandoff'
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

function CurrentScreen({ h }: { h: Handoff }) {
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
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 62, lineHeight: 0.94, letterSpacing: '-.025em' }}>
        HAND
        <br />
        OFF
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
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 34, lineHeight: 1.05 }}>
        That account is not on a campus we run yet.
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.4, margin: '18px 0 0', maxWidth: '28ch' }}>
        {email ? <b>{email}</b> : 'That address'} is not a verified school email for an enrolled campus. Handoff is
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
            fontWeight: 800,
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
            handoffs: p.handoffs,
            noShows: p.no_shows,
            joinedAt: p.joined_at,
            refreshProfile: auth.refreshProfile,
            signOut: auth.signOut,
          }
        : undefined,
    [p, auth.refreshProfile, auth.signOut],
  )

  const h = useHandoff(CONFIG, live)

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

  return (
    <>
      {body}
      <Toast text={h.toast} />
    </>
  )
}

/** The design-reference presentation: phone frame + rationale column, always on
 *  seed data so the whole flow is walkable without an account. */
function Showcase() {
  const h = useHandoff({ moveOutBanner: true, defaultTab: 'free' })
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

export default function App() {
  const showcase =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('showcase')

  if (showcase) return <Showcase />

  return (
    <div className="app-shell">
      <div className="app-viewport">
        <LiveApp />
      </div>
    </div>
  )
}
