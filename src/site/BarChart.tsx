import { useState } from 'react'
import { useSeen } from './Reveal'

export interface Row {
  label: string
  value: number
  display: string
  note?: string
}

/**
 * A sorted horizontal bar chart, one series.
 *
 * One series means magnitude is carried by length, so every bar is the same
 * green — a second hue here would encode nothing. Every bar is direct-labelled
 * with its value, which is also what makes the lighter mark legible; hovering a
 * row gives the sentence behind the number. Bars grow once, when the chart is
 * first scrolled into view, and not at all if the reader asked for less motion.
 */
export function BarChart({ rows, unit }: { rows: Row[]; unit: string }) {
  const { ref, seen } = useSeen<HTMLDivElement>()
  const [hover, setHover] = useState<string | null>(null)
  const max = Math.max(...rows.map((r) => r.value), 0.0001)

  return (
    <div className="chart" ref={ref}>
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={'chart__row' + (hover === r.label ? ' is-hover' : '')}
          onMouseEnter={() => setHover(r.label)}
          onMouseLeave={() => setHover(null)}
        >
          <div className="chart__label">{r.label}</div>
          <div className="chart__track">
            <div
              className="chart__bar"
              style={{
                width: seen ? (r.value / max) * 100 + '%' : '0%',
                transitionDelay: 60 + i * 45 + 'ms',
              }}
            />
            <div className="chart__value">{r.display}</div>
          </div>
          {r.note && hover === r.label && <div className="chart__tip">{r.note}</div>}
        </div>
      ))}
      <div className="chart__unit">{unit}</div>
    </div>
  )
}
