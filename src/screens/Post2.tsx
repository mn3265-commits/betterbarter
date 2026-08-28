import { CategoryIcon } from '../components/CategoryIcon'
import { AppBody, AppFooter, AppHeader } from '../components/Shell'
import { CATEGORIES, CONDITIONS, KIND_STATUS } from '../lib/taxonomy'
import type { Barter } from '../lib/useBarter'

/**
 * Post, step 2 — the listing itself.
 *
 * The team's call on 26 August was a real form: category, condition, size,
 * a [Brand] - [Item] title, a price path and a meetup place. A board is only
 * searchable if two people describing the same object land in the same
 * category, and that cannot be left to free text.
 *
 * What survives from the old design is the sentence at the top. Type "giving
 * away my ikea desk lamp, barely used, front desk tonight" and the fields fill
 * themselves in — anything you then edit is yours and is never overwritten. So
 * the fast path stays about twenty seconds, and the slow path is a form that
 * knows what it wants.
 */
export function Post2({ h }: { h: Barter }) {
  const f = h.form
  const blocked = h.ruleHits.some((x) => x.level === 'blocked')
  const kinds: [Barter['form']['kind'], string][] = [
    ['free', 'Give it away'],
    ['sale', 'Sell it'],
    ['trade', 'Swap it'],
    ['rent', 'Rent it out'],
  ]

  return (
    <div className="screen">
      <AppHeader kicker="Step 2 of 2" title="Say what it is" onBack={h.toStep1} />

      <AppBody>
        {/* the sentence, still doing the first pass */}
        <div className="field">
          <label>Say it how you would text a friend — the fields fill themselves in</label>
          <textarea
            className="input"
            value={h.postText}
            onChange={(e) => h.setPostText(e.target.value)}
            placeholder="giving away my ikea desk lamp, barely used, bulb still in it. leaving friday so grab it tonight at the front desk"
            style={{ minHeight: 84 }}
          />
          {!h.postText.trim() && (
            <button onClick={h.useExample} className="btn btn-ghost" style={{ fontSize: 12.5, paddingInline: 0 }}>
              Not typing? Use an example →
            </button>
          )}
        </div>

        <div className="app-hr" />

        <div className="field">
          <label>Brand (optional)</label>
          <input className="input" value={f.brand} onChange={(e) => h.setField('brand', e.target.value)} placeholder="IKEA" />
        </div>

        <div className="field">
          <label>What it is</label>
          <input
            className="input"
            value={f.item}
            onChange={(e) => h.setField('item', e.target.value)}
            placeholder="Desk lamp"
          />
          <div className="field__hint">
            Shows as <b>{[f.brand.trim(), f.item.trim()].filter(Boolean).join(' - ') || 'Untitled thing'}</b>
          </div>
        </div>

        <div className="field">
          <label>Category</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: 'var(--color-accent)' }}>
              <CategoryIcon category={f.category} size={20} />
            </span>
          <select className="input" value={f.category} onChange={(e) => h.setField('category', e.target.value as never)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          </div>
        </div>

        <div className="field">
          <label>Condition</label>
          <select className="input" value={f.condition} onChange={(e) => h.setField('condition', e.target.value as never)}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Size or dimensions (if it matters)</label>
          <input
            className="input"
            value={f.dimensions}
            onChange={(e) => h.setField('dimensions', e.target.value)}
            placeholder="5 × 7 ft, or 3.2 cu ft"
          />
        </div>

        {/* how it moves */}
        <div className="field">
          <label>How you are listing it</label>
          <div className="app-choice">
            {kinds.map(([k, label]) => {
              const soon = KIND_STATUS[k] === 'soon'
              return (
                <button
                  key={k}
                  onClick={() =>
                    soon
                      ? h.flash('Lending opens once returns are handled properly. Everything else is live now.')
                      : h.setField('kind', k)
                  }
                  className={'app-choice__opt' + (f.kind === k ? ' is-on' : '') + (soon ? ' is-soon' : '')}
                >
                  {label}
                  {soon && <span className="app-choice__soon">soon</span>}
                </button>
              )
            })}
          </div>
        </div>

        {f.kind === 'sale' && (
          <div className="field">
            <label>How much</label>
            <input
              className="input"
              type="number"
              min={0}
              value={f.price}
              onChange={(e) => h.setField('price', Number(e.target.value))}
            />
          </div>
        )}

        {f.kind === 'trade' && (
          <div className="field">
            <label>What you want to swap it for</label>
            <input
              className="input"
              value={f.tradeFor}
              onChange={(e) => h.setField('tradeFor', e.target.value)}
              placeholder="a desk fan, or a kettle"
            />
          </div>
        )}

        {f.kind === 'rent' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>How much</label>
              <input
                className="input"
                type="number"
                min={0}
                value={f.rentRate}
                onChange={(e) => h.setField('rentRate', Number(e.target.value))}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>For how long</label>
              <select className="input" value={f.rentPeriod} onChange={(e) => h.setField('rentPeriod', e.target.value)}>
                {['day', 'week', 'month', 'term'].map((x) => (
                  <option key={x} value={x}>
                    per {x}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="field">
          <label>Description (optional)</label>
          <textarea
            className="input"
            value={f.description}
            onChange={(e) => h.setField('description', e.target.value)}
            placeholder="Anything the photo does not show — a scratch, a missing cable, why you are letting it go."
          />
        </div>

        <div className="field">
          <label>Where you want to hand it over</label>
          <input
            className="input"
            value={f.spot}
            onChange={(e) => h.setField('spot', e.target.value)}
            list="hf-spots"
            placeholder="Butler Library entrance"
          />
          <datalist id="hf-spots">
            {h.campusSpots.map((s) => (
              <option key={s.name} value={s.name} />
            ))}
          </datalist>
          <div className="field__hint">Somewhere public on campus. Never a room number.</div>
        </div>

        <label className="app-check">
          <input type="checkbox" checked={h.needsHelp} onChange={(e) => h.setNeedsHelp(e.target.checked)} />
          <span>
            <b>This needs two people or a trolley</b>
            <span>
              Students who carry things for a few dollars see it. No van, no company — someone on your campus with an
              hour, paid directly by whoever needs the help.
            </span>
          </span>
        </label>
      </AppBody>

      {h.ruleHits.length > 0 && (
        <div style={{ borderTop: '1px solid var(--color-accent)', background: 'var(--color-accent-100)', padding: '13px 16px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-800)' }}>
            {blocked ? 'Not allowed on the board' : 'Check this before you post'}
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.45, marginTop: 6 }}>{h.ruleHits[0].why}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
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

      <AppFooter>
        <button onClick={h.publish} disabled={h.busy || blocked} className="app-cta">
          {h.busy ? 'Posting…' : blocked ? 'Cannot post this' : `Post to ${h.campusName || 'campus'}`}
        </button>
      </AppFooter>
    </div>
  )
}
