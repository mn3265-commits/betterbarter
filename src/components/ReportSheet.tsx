import { useState } from 'react'
import { REPORT_REASONS } from '../lib/api'

/**
 * The sheet behind "Report".
 *
 * It asks for a reason from a fixed list, because free text alone cannot be
 * triaged, and it says plainly what will happen — both halves of what the
 * community rules promise.
 */
export function ReportSheet({
  who,
  onCancel,
  onSend,
}: {
  who: string
  onCancel: () => void
  onSend: (reason: string, note: string) => void
}) {
  const [reason, setReason] = useState(REPORT_REASONS[0][0])
  const [note, setNote] = useState('')

  return (
    <div className="app-sheet">
      <div className="app-sheet__title">Report {who}</div>
      <p className="app-sheet__body">
        They disappear from your board straight away, and one of us reads this. Tell us what happened — it is the only
        thing we have to go on.
      </p>

      <div className="app-choice" style={{ marginTop: 4 }}>
        {REPORT_REASONS.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setReason(value)}
            className={'app-choice__opt' + (reason === value ? ' is-on' : '')}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        className="input"
        style={{ marginTop: 12 }}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Anything that helps us understand it (optional)"
      />

      <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
        <button onClick={() => onSend(reason, note)} className="btn btn-primary">
          Send report
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  )
}
