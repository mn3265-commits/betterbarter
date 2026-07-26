/** Square switch (like everything else): 46 × 24 box, 2px border, 16 × 16 knob. */
export function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      style={{ flex: 'none', border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}
    >
      <span
        style={{
          display: 'flex',
          width: 46,
          height: 24,
          border: on ? '2px solid var(--color-accent)' : '2px solid var(--color-divider)',
          background: on ? 'var(--color-accent)' : 'transparent',
          alignItems: 'center',
          justifyContent: on ? 'flex-end' : 'flex-start',
          padding: 2,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            background: on ? 'var(--color-bg)' : 'var(--color-neutral-500)',
            display: 'block',
          }}
        />
      </span>
    </button>
  )
}
