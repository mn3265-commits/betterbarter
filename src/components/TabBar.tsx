import { List, MessageSquare, Plus, Search, User } from 'lucide-react'
import type { Handoff } from '../lib/useHandoff'

const accent = 'var(--color-accent)'
const dim = 'color-mix(in srgb, var(--color-text) 45%, transparent)'

function tabButton(onClick: () => void, color: string, icon: React.ReactNode, label: string) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        padding: '4px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span style={{ color, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color }}>{label}</span>
    </button>
  )
}

/** The 5-item bottom tab bar. Post is a solid accent rectangle, not an icon+label. */
export function TabBar({ h }: { h: Handoff }) {
  const isBoard = h.screen === 'browse'
  const cBrowse = isBoard && h.tab !== 'wanted' ? accent : dim
  const cWanted = isBoard && h.tab === 'wanted' ? accent : dim
  const cChats = h.screen === 'chats' || h.screen === 'chat' ? accent : dim
  const cMe = h.screen === 'me' ? accent : dim

  return (
    <div
      className="tabbar"
      style={{
        borderTop: '2px solid var(--color-divider)',
        display: 'flex',
        padding: '9px 6px 38px',
        background: 'var(--color-bg)',
      }}
    >
      {tabButton(h.jumpBrowse, cBrowse, <Search size={21} strokeWidth={1.8} />, 'Board')}
      {tabButton(h.jumpWanted, cWanted, <List size={21} strokeWidth={1.8} />, 'Wanted')}
      <button
        onClick={h.startPost}
        style={{
          flex: 1,
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
          padding: '4px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 26,
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
          }}
        >
          <Plus size={18} strokeWidth={2.2} />
        </span>
        <span style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>
          Post
        </span>
      </button>
      {tabButton(h.jumpChats, cChats, <MessageSquare size={21} strokeWidth={1.8} />, 'Chats')}
      {tabButton(h.jumpMe, cMe, <User size={21} strokeWidth={1.8} />, 'Me')}
    </div>
  )
}
