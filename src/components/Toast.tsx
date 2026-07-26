/** A confirmation toast pinned 110px above the bottom edge, insets 16px. */
export function Toast({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div
      role="status"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 110,
        background: 'var(--color-text)',
        color: 'var(--color-bg)',
        padding: '13px 14px',
        fontSize: 13.5,
        lineHeight: 1.35,
        animation: 'hf-rise .22s ease-out',
        zIndex: 80,
      }}
    >
      {text}
    </div>
  )
}
