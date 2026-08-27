import { ArrowLeft } from 'lucide-react'

/**
 * The app's chrome, in one place.
 *
 * Every screen used to draw its own header: 58px of top padding here, 60px
 * there, a title at 19px on one screen and 13px on the next, a 2px rule on some
 * and nothing on others. None of that was a decision — it was twelve files
 * drifting. These three pieces are the decision, and every screen is now made
 * of them.
 *
 *   AppHeader  fixed height, one type size, one rule, optional back and action
 *   AppBody    the only scrolling region, one padding
 *   AppFooter  the sticky action shelf that sits above the tab bar
 */

export function AppHeader({
  title,
  kicker,
  onBack,
  action,
}: {
  title: React.ReactNode
  kicker?: string
  onBack?: () => void
  action?: React.ReactNode
}) {
  return (
    <header className="app-hd">
      {onBack && (
        <button onClick={onBack} className="app-hd__back" aria-label="Back">
          <ArrowLeft size={19} strokeWidth={2.1} />
        </button>
      )}
      <div className="app-hd__text">
        {kicker && <div className="app-hd__kicker">{kicker}</div>}
        <div className="app-hd__title">{title}</div>
      </div>
      {action && <div className="app-hd__action">{action}</div>}
    </header>
  )
}

export function AppBody({ children, pad = true }: { children: React.ReactNode; pad?: boolean }) {
  return <div className={'app-body' + (pad ? '' : ' app-body--flush')}>{children}</div>
}

export function AppFooter({ children }: { children: React.ReactNode }) {
  return <div className="app-ft">{children}</div>
}
