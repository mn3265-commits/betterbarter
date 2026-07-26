import { IOSDevice } from './components/IOSDevice'
import { Toast } from './components/Toast'
import { Notes } from './Notes'
import { useHandoff } from './lib/useHandoff'
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

export default function App() {
  const h = useHandoff(CONFIG)

  const screen = (() => {
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
  })()

  return (
    <div className="stage">
      <Notes h={h} />
      <div style={{ flex: 'none' }}>
        <IOSDevice>
          <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            {screen}
            <Toast text={h.toast} />
          </div>
        </IOSDevice>
      </div>
    </div>
  )
}
