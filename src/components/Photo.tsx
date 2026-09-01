import { CategoryIcon } from './CategoryIcon'

/** A listing photo.
 *
 *  These used to print greyscale, which was a design-system rule inherited from
 *  a notice-board aesthetic. Tessa killed it on 31 August and she is right: the
 *  colour of a thing is half of what you are deciding about when you look at a
 *  second-hand desk lamp.
 *
 *  Posting requires a photo, so in normal use `url` is always set. It can still
 *  be missing: an upload that failed after the listing was written, or a row
 *  seeded straight into the database. Those used to render as a bare hatched
 *  box, which reads as broken rather than as empty — so when the category is
 *  known the placeholder carries its icon, and the card looks like a thing
 *  rather than a hole. */
export function Photo({
  url,
  caption,
  category,
  height,
  hatch = 'hatch-sm',
  border = '1px solid var(--color-divider)',
  children,
}: {
  url?: string | null
  caption?: string
  category?: string
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
          }}
        />
      )}
      {!url && category && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent)',
            opacity: 0.28,
          }}
        >
          <CategoryIcon category={category} size={38} />
        </span>
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
