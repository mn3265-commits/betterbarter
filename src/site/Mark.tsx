/**
 * The mark: two B's sharing one spine.
 *
 * BetterBarter is two B's, and a barter is two sides of one exchange — so the
 * mark is a B and its mirror image hung on a single stem. Both facts in one
 * shape, and a shape that belongs to nobody else.
 *
 * It replaces two earlier marks that were not the same mark as each other: an
 * arch with three dots on the app icon, and a pair of recycling arrows beside
 * the wordmark. Whichever a person saw first, the other looked like a different
 * company.
 *
 * One grid, one weight. Everything else — the favicon, the PWA icons, the
 * wordmark lockup, the 1000x270 PNG — is this geometry at a different size.
 * If you change a curve here, run `scripts/build-logo.py` so the rest follow.
 */

/** The five paths, at viewBox 0 0 100 100. Shared with the build script. */
export const MARK_PATHS = [
  'M50 16v68',                          // the spine both letters hang on
  'M50 22h13a14 14 0 0 1 0 28H50',      // right B, upper bowl
  'M50 50h15a14 14 0 0 1 0 28H50',      // right B, lower bowl (wider, as a B is)
  'M50 22H37a14 14 0 0 0 0 28h13',      // mirrored B, upper bowl
  'M50 50H35a14 14 0 0 0 0 28h15',      // mirrored B, lower bowl
]

export function Mark({ size = 20, strokeWidth }: { size?: number; strokeWidth?: number }) {
  // Small sizes need a heavier stroke or the counters close up and it greys out.
  const w = strokeWidth ?? (size <= 18 ? 10 : size <= 28 ? 9 : 8.5)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flex: 'none' }}
    >
      {MARK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
