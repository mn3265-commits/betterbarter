/** A listing photo. Real photos print full-bleed grayscale, per the design
 *  system; without one we fall back to the 45° hatch placeholder. */
export function Photo({
  url,
  caption,
  height,
  hatch = 'hatch-sm',
  border = '1px solid var(--color-divider)',
  children,
}: {
  url?: string | null
  caption?: string
  height: number | string
  hatch?: 'hatch-sm' | 'hatch-lg'
  border?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={url ? undefined : hatch}
      style={{
        height,
        border,
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        padding: 7,
        overflow: 'hidden',
        background: url ? 'var(--color-neutral-200)' : undefined,
      }}
    >
      {url && (
        <img
          src={url}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'grayscale(1) contrast(1.08)',
          }}
        />
      )}
      {caption && (
        <span
          style={{
            position: 'relative',
            fontSize: 8,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: url ? 'var(--color-bg)' : 'var(--color-neutral-700)',
            textShadow: url ? '0 1px 3px rgba(0,0,0,.7)' : undefined,
          }}
        >
          {caption}
        </span>
      )}
      {children}
    </div>
  )
}
