/**
 * The mark: two people, and the object arcing between them.
 *
 * The arc is the handoff; the dots at each end are the two students; the gold
 * dot at the top is the thing being handed over — the one moment this whole
 * product is built around, and the only place the second brand colour appears
 * inside the mark. It survives 16px, which the wordmark does not, so this is
 * what goes in a tab, an app icon and a corner.
 */
export function LoopMark({ size = 20, gold = true }: { size?: number; gold?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flex: 'none' }}
    >
      <path
        d="M14 66c8-30 26-44 36-44s28 14 36 44"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="14" cy="66" r="10" fill="currentColor" />
      <circle cx="86" cy="66" r="10" fill="currentColor" />
      <circle cx="50" cy="26" r="12" fill={gold ? 'var(--color-signal)' : 'currentColor'} />
    </svg>
  )
}
