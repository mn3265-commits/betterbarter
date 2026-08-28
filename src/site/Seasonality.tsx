import { useSeen } from './Reveal'

/**
 * The shape of a residential year.
 *
 * This is a schematic, not a measurement, and it says so on the page: nobody has
 * per-week discard data for a campus, because the thing that would produce it is
 * the product we are building. What it does show is the fact everyone at a
 * university already knows — that disposal and acquisition are the same curve,
 * eight weeks apart, twice a year — and that is the argument for a board that
 * runs all year rather than a drive that runs in May.
 */
const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
/** Relative height, 0–1. Two spikes: arrival buying, and move-out discard. */
const BUY = [0.95, 0.3, 0.2, 0.15, 0.5, 0.2, 0.15, 0.2, 0.25, 0.1, 0.1, 0.55]
const DISCARD = [0.2, 0.1, 0.12, 0.35, 0.15, 0.1, 0.12, 0.3, 1, 0.35, 0.08, 0.15]

const W = 720
const H = 190
const PAD = 26

function path(series: number[]): string {
  const step = (W - PAD * 2) / (series.length - 1)
  return series
    .map((v, i) => {
      const x = PAD + i * step
      const y = H - PAD - v * (H - PAD * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function Seasonality() {
  const { ref, seen } = useSeen<HTMLDivElement>()
  const step = (W - PAD * 2) / (MONTHS.length - 1)

  return (
    <div className="season" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Buying and discarding across a university year, schematic">
        {/* the two moments that matter, marked before the lines are read */}
        {[0, 8].map((i) => (
          <rect
            key={i}
            x={PAD + i * step - 16}
            y={PAD - 8}
            width={32}
            height={H - PAD * 2 + 16}
            className="season__band"
          />
        ))}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="season__axis" />
        <path d={path(BUY)} className={'season__line season__line--buy' + (seen ? ' is-in' : '')} />
        <path d={path(DISCARD)} className={'season__line season__line--discard' + (seen ? ' is-in' : '')} />
        {MONTHS.map((m, i) => (
          <text key={m} x={PAD + i * step} y={H - 8} textAnchor="middle" className="season__label">
            {m}
          </text>
        ))}
      </svg>
      <div className="season__key">
        <span>
          <i className="season__swatch season__swatch--discard" /> Things being thrown out
        </span>
        <span>
          <i className="season__swatch season__swatch--buy" /> Things being bought new
        </span>
      </div>
    </div>
  )
}
