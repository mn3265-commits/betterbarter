import { useState } from 'react'
import { AppBody, AppFooter, AppHeader } from '../components/Shell'
import { ArrowRight, Camera, MessageSquare, Search, ShieldCheck } from 'lucide-react'

interface Card {
  kicker: string
  title: string
  body: string
  icon: React.ReactNode
}

const CARDS: Card[] = [
  {
    kicker: 'Step one',
    title: 'Post it in about twenty seconds',
    body:
      'Take one photo where the thing stands, then write a sentence the way you would text a friend. The app reads the price, the category, the condition and the meetup spot out of your own words — there is no form to fill in, and you can correct any of it in one tap.',
    icon: <Camera size={26} strokeWidth={1.8} />,
  },
  {
    kicker: 'Step two',
    title: 'Claim what you want, nearest first',
    body:
      'The Marketplace only shows your campus, closest halls first. Free things are free — take them. Priced things are cheap and settled between you two; the app never touches money.',
    icon: <Search size={26} strokeWidth={1.8} />,
  },
  {
    kicker: 'Step three',
    title: 'Meet somewhere public',
    body:
      'Claiming opens a conversation with the meetup already written into it, and holds the item for three hours. Pick a lobby, a front desk, a dining entrance — somewhere other people are. Never a room number, yours or theirs.',
    icon: <MessageSquare size={26} strokeWidth={1.8} />,
  },
  {
    kicker: 'What keeps it safe',
    title: 'Everyone here goes to your school',
    body:
      'One verified school email per account, and you only ever see your own campus. Your handoff count is public — it is the whole reputation system. Anything that feels wrong, report it: that account disappears from your Marketplace and gets reviewed.',
    icon: <ShieldCheck size={26} strokeWidth={1.8} />,
  },
]

/** The first-run walkthrough. Also reachable any time from Me. */
export function HowItWorks({ onDone, doneLabel = 'Go to the Marketplace' }: { onDone: () => void; doneLabel?: string }) {
  const [i, setI] = useState(0)
  const card = CARDS[i]
  const last = i === CARDS.length - 1

  return (
    <div className="screen">
      <AppHeader
        title="How BetterBarter works"
        action={
          <button onClick={onDone} className="btn btn-ghost" style={{ fontSize: 12 }}>
            Skip
          </button>
        }
      />

      <AppBody>
        <div style={{ color: 'var(--color-accent-700)', display: 'flex' }}>{card.icon}</div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'var(--color-accent-700)',
            marginTop: 14,
          }}
        >
          {card.kicker}
        </div>
        <h3 style={{ fontSize: 26, margin: '6px 0 10px', lineHeight: 1.12 }}>{card.title}</h3>
        <p style={{ fontSize: 14.5, lineHeight: 1.5, opacity: 0.8, margin: 0, textWrap: 'pretty' }}>{card.body}</p>
      </AppBody>

      <AppFooter>
        {/* progress: one flush-left bar per card */}
        <div style={{ display: 'flex', gap: 4 }}>
          {CARDS.map((c, n) => (
            <div
              key={c.title}
              style={{
                height: 3,
                flex: 1,
                background: n <= i ? 'var(--color-accent)' : 'var(--color-divider)',
              }}
            />
          ))}
        </div>
        <button onClick={() => (last ? onDone() : setI(i + 1))} className="app-cta">
          <span>{last ? doneLabel : 'Next'}</span>
          <ArrowRight size={20} strokeWidth={2} />
        </button>
      </AppFooter>
    </div>
  )
}
