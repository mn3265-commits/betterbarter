import { useEffect } from 'react'
import { IOSDevice } from './components/IOSDevice'
import { Toast } from './components/Toast'
import { Notes } from './Notes'
import { useAuth } from './lib/useAuth'
import { useHandoff, type Handoff } from './lib/useHandoff'
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

/** Presentation config, mapping to the prototype's editable props. */
const CONFIG = { moveOutBanner: true, defaultTab: 'free' as const }

function CurrentScreen({ h }: { h: Handoff }) {
  switch (h.screen) {
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

function AppBody() {
  const auth = useAuth()
  const h = useHandoff(CONFIG)

  // Once signed in, land on the board instead of the gate.
  useEffect(() => {
    if (auth.configured && auth.profile && h.screen === 'gate') h.go('browse')
  }, [auth.configured, auth.profile, h.screen, h])

  let body: React.ReactNode
  if (auth.configured && auth.loading) {
    body = <Splash />
  } else if (auth.configured && !auth.profile) {
    body = <Gate h={h} auth={auth} />
  } else {
    body = <CurrentScreen h={h} />
  }

  return (
    <>
      {body}
      <Toast text={h.toast} />
    </>
  )
}

export default function App() {
  // `?showcase` renders the design-reference view (phone frame + rationale
  // column). The default is the app itself — full-screen, mobile-first.
  const showcase =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('showcase')

  if (showcase) {
    // Showcase keeps the seed-data demo (no auth gating) so the whole flow is
    // walkable without a login.
    return <Showcase />
  }

  return (
    <div className="app-shell">
      <div className="app-viewport">
        <AppBody />
      </div>
    </div>
  )
}

function Showcase() {
  const h = useHandoff(CONFIG)
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
