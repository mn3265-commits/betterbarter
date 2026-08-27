import { useEffect, useRef, useState } from 'react'

/**
 * Fade-and-rise a block the first time it is scrolled into view, once.
 *
 * Motion here is orientation, not decoration: it tells you a new section has
 * arrived and then gets out of the way. Anyone who has asked their system for
 * less of it gets none — `prefers-reduced-motion` short-circuits to the final
 * state, and so does a browser with no IntersectionObserver.
 */
export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    // Already on screen at mount (a deep link, a short page, a restored scroll
    // position): show it now rather than waiting for a scroll that never comes.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )
    io.observe(el)

    // Nothing on this page may depend on an observer firing. If it has not
    // within a couple of seconds — background tab, odd embedding, a browser
    // being clever — the content appears anyway. Invisible text is a bug, not
    // an animation.
    const failsafe = setTimeout(() => setShown(true), 2000)
    return () => {
      io.disconnect()
      clearTimeout(failsafe)
    }
  }, [])

  return (
    <div ref={ref} className={'reveal' + (shown ? ' is-in' : '')} style={{ transitionDelay: delay + 'ms' }}>
      {children}
    </div>
  )
}

/** True once the element has been seen — for charts that animate their marks. */
export function useSeen<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    const failsafe = setTimeout(() => setSeen(true), 2000)
    return () => {
      io.disconnect()
      clearTimeout(failsafe)
    }
  }, [])
  return { ref, seen }
}
