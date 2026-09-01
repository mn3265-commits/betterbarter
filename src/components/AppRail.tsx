import { List, MessageSquare, Plus, Search, User } from 'lucide-react'
import { Mark } from '../site/Mark'
import type { Barter } from '../lib/useBarter'

/**
 * The desktop navigation rail. It is the bottom tab bar, stood up: same five
 * destinations, same order, same active logic — a laptop just has room to put
 * them beside the board instead of under it. Hidden below 1000px, where the tab
 * bar takes over.
 */
export function AppRail({ h }: { h: Barter }) {
  const isBoard = h.screen === 'browse'
  const items: [boolean, () => void, React.ReactNode, string][] = [
    [isBoard && h.tab !== 'wanted', h.jumpBrowse, <Search size={19} strokeWidth={1.9} />, 'Marketplace'],
    [isBoard && h.tab === 'wanted', h.jumpWanted, <List size={19} strokeWidth={1.9} />, 'Looking For'],
    [h.screen === 'chats' || h.screen === 'chat', h.jumpChats, <MessageSquare size={19} strokeWidth={1.9} />, 'Chats'],
    [h.screen === 'me', h.jumpMe, <User size={19} strokeWidth={1.9} />, 'Profile'],
  ]

  return (
    <nav className="app-rail">
      <a className="app-rail__mark" href="/">
        <Mark size={20} />
        BetterBarter
      </a>

      <button className="app-rail__post" onClick={h.startPost}>
        <Plus size={19} strokeWidth={2.4} />
        List Item
      </button>

      <div className="app-rail__nav">
        {items.map(([active, go, icon, label]) => (
          <button key={label} onClick={go} className={'app-rail__item' + (active ? ' is-active' : '')}>
            {icon}
            {label}
          </button>
        ))}
      </div>

      <div className="app-rail__foot">
        {h.campusName || 'Campus'} · {h.liveCount} live
        <br />
        <a href="/#impact">How impact is counted</a>
      </div>
    </nav>
  )
}
