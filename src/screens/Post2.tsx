import type { EditField } from '../data/types'
import type { Handoff } from '../lib/useHandoff'

/**
 * Post, step 2 — one paragraph, no form (modal). The core interaction: the user
 * writes one paragraph and the app fills in name, price, category, condition,
 * meetup spot and pickup time. There are no required fields.
 */
export function Post2({ h }: { h: Handoff }) {
  const p = h.parse
  // A blocked match cannot be posted at all, so the button says so.
  const blocked = h.ruleHits.some((x) => x.level === 'blocked')
  const rows: { key: string; label: string; value: string; fixable: boolean }[] = [
    { key: 'title', label: 'What it is', value: p.title, fixable: true },
    { key: 'price', label: 'Price', value: p.free ? 'Free' : '$' + p.price, fixable: true },
    { key: 'cat', label: 'Category', value: p.cat + ' · ' + p.cond, fixable: false },
    { key: 'spot', label: 'Hand it off at', value: p.spot, fixable: true },
    { key: 'when', label: 'When', value: p.when, fixable: false },
  ]

  const editLabel =
    h.edit === 'price'
      ? 'Price — a number, or the word free'
      : h.edit === 'spot'
        ? 'Name the spot'
        : 'What it is'
  const editValue = h.edit === 'price' ? (p.free ? 'free' : String(p.price)) : h.edit === 'spot' ? p.spot : p.title

  return (
    <div className="screen">
      <div
        style={{
          padding: '58px 16px 10px',
          borderBottom: '2px solid var(--color-divider)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <button
          onClick={h.toStep1}
          style={{
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 13,
            color: 'var(--color-text)',
          }}
        >
          Back
        </button>
        <div style={{ marginLeft: 'auto', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.6 }}>
          Step 2 of 2
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            className={h.photoPreview ? undefined : 'hatch-sm'}
            style={{ width: 66, height: 66, flex: 'none', border: '1px solid var(--color-divider)', overflow: 'hidden' }}
          >
            {h.photoPreview && (
              <img src={h.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.08)' }} />
            )}
          </div>
          <div style={{ fontSize: 12, opacity: 0.65, textWrap: 'pretty' }}>
            Goes to everyone at {h.campusName || 'campus'}.{h.me.building ? ` People in ${h.me.building.split(' ')[0]} see it at the top.` : ''}
          </div>
        </div>
        <hr className="hr" />
        <div className="field">
          <label>Say it how you would text a friend</label>
          <textarea
            className="input"
            placeholder="giving away my ikea desk lamp, barely used, bulb still in it. leaving friday so grab it tonight at the front desk"
            value={h.postText}
            onChange={(e) => h.setPostText(e.target.value)}
            style={{ minHeight: 118, lineHeight: 1.45 }}
          />
        </div>
        <button onClick={h.useExample} className="btn btn-ghost" style={{ marginTop: 2, fontSize: 12 }}>
          Not typing? Use an example →
        </button>

        {!p.empty ? (
          <>
            <div style={{ marginTop: 16, border: '2px solid var(--color-text)' }}>
              <div
                style={{
                  padding: '9px 12px',
                  background: 'var(--color-text)',
                  color: 'var(--color-bg)',
                  fontSize: 10,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                }}
              >
                Filled in from what you wrote
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {rows.map((r) => (
                  <div
                    key={r.key}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 10,
                      padding: '10px 12px',
                      borderTop: '1px solid var(--color-divider)',
                    }}
                  >
                    <div style={{ width: 96, flex: 'none', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', opacity: 0.55 }}>
                      {r.label}
                    </div>
                    <div style={{ flex: 1, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14.5, lineHeight: 1.25 }}>
                      {r.value}
                    </div>
                    {r.fixable && (
                      <button onClick={() => h.setEdit(r.key as EditField)} className="btn btn-ghost" style={{ flex: 'none', fontSize: 12, padding: 0 }}>
                        Fix
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {h.edit && (
              <div style={{ marginTop: 12, border: '2px solid var(--color-accent)', padding: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>{editLabel}</label>
                  <input className="input" value={editValue} onChange={(e) => h.onEditValue(e.target.value)} />
                </div>
                <button onClick={() => h.setEdit(null)} className="btn btn-primary" style={{ marginTop: 10 }}>
                  Looks right
                </button>
              </div>
            )}

            <p style={{ fontSize: 11.5, opacity: 0.6, margin: '12px 0 0', textWrap: 'pretty' }}>
              Nothing above is a required field. Your paragraph is the listing — this is only what the app read out of it.
            </p>
          </>
        ) : (
          <p style={{ fontSize: 12.5, opacity: 0.6, margin: '16px 0 0', textWrap: 'pretty' }}>
            Write a line or two and the price, category, condition and meetup spot fill themselves in below. No form.
          </p>
        )}
      </div>

      {h.ruleHits.length > 0 && (
        <div style={{ borderTop: '2px solid var(--color-accent)', background: 'var(--color-accent-100)', padding: '13px 16px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-accent-800)' }}>
            {h.ruleHits[0].level === 'blocked' ? 'Not allowed on the board' : 'Check this before you post'}
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, marginTop: 5, color: 'var(--color-accent-800)' }}>
            This reads like {h.ruleHits.map((x) => x.label).join(', ')}.
          </div>
          {h.ruleHits.map((x) => (
            <div key={x.label} style={{ fontSize: 12.5, color: 'var(--color-accent-800)', opacity: 0.85, marginTop: 4, textWrap: 'pretty' }}>
              {x.why}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={h.editAfterFlag} className="btn btn-primary">
              Edit my post
            </button>
            {h.ruleHits.every((x) => x.level === 'flagged') && (
              <button onClick={h.postAnyway} className="btn btn-secondary">
                It is not that — post it
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ borderTop: '2px solid var(--color-divider)', padding: '12px 16px 40px', background: 'var(--color-bg)' }}>
        <button
          onClick={h.publish}
          disabled={h.busy || blocked}
          style={{
            width: '100%',
            border: 0,
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 15,
            padding: '15px 16px',
            textAlign: 'left',
            cursor: blocked ? 'not-allowed' : 'pointer',
            opacity: blocked ? 0.45 : 1,
          }}
        >
          {h.busy ? 'Posting…' : blocked ? 'Cannot post this' : `Post to ${h.campusName || 'campus'}`}
        </button>
      </div>
    </div>
  )
}
