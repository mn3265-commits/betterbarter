import { useEffect, useState } from 'react'
import { useSeen } from './Reveal'

/**
 * A number that counts up the first time it is seen, then behaves like a
 * number. Used only where the figure is the point of the block — a stat tile or
 * a forecast — and never on body text, where movement would just be noise.
 *
 * `format` keeps the unit logic in the caller, so the same component animates
 * "1.2 t" and "360 objects" without knowing what either means.
 */
export function CountUp({
  value,
  format,
  ms = 900,
}: {
  value: number
  format: (n: number) => string
  ms?: number
}) {
  const { ref, seen } = useSeen<HTMLSpanElement>()
  const [shown, setShown] = useState(value)

  useEffect(() => {
    if (!seen) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setShown(value)
      return
    }
    const from = 0
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      // ease-out: fast where the reader looks, calm where they read.
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(from + (value - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, value, ms])

  return <span ref={ref}>{format(seen ? shown : 0)}</span>
}
