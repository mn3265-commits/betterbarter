/**
 * The mark: one object leaving a hand and arriving in another, closed into a
 * loop. Drawn rather than imported so it inherits the current colour, and kept
 * to four strokes so it survives at 18px beside the wordmark.
 */
export function LoopMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flex: 'none' }}
    >
      <path d="M4 12a8 8 0 0 1 13.7-5.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
      <path d="M20 12a8 8 0 0 1-13.7 5.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
      <path d="M18 2.6v4.2h-4.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
      <path d="M6 21.4v-4.2h4.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
    </svg>
  )
}
