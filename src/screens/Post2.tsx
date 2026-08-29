import { useState } from 'react'
import { CategoryIcon } from '../components/CategoryIcon'
import { AppBody, AppFooter, AppHeader } from '../components/Shell'
import { CATEGORIES, CONDITIONS, KIND_STATUS } from '../lib/taxonomy'
import type { Barter } from '../lib/useBarter'

/**
 * Post, step 2 — the listing itself.
 *
 * Field order and labels are Tessa's review of 28 August: you say what kind of
 * thing it is before you say which thing it is, because that is the order a
 * person thinks in when they are standing over a pile of stuff.
 *
 * The sentence parser survives that review, but not as a step. Her objection
 * was right — a free-text box sitting above the form reads as a second job, and
 * it delayed everyone to speed up some. So the form is now the path, and the
 * sentence is a link you can ignore: open it, type "giving away my ikea desk
 * lamp, barely used", and the fields fill themselves in. Anything you have
 * already edited is yours and is never overwritten.
 */
export function Post2({ h }: { h: Barter }) {
  const f = h.form
  const blocked = h.ruleHits.some((x) => x.level === 'blocked')
  const [sentence, setSentence] = useState(false)
  const [elsewhere, setElsewhere] = useState(false)

  const kinds: [Barter['form']['kind'], string][] = [
    ['free', 'Give It'],
    ['sale', 'Sell It'],
    ['trade', 'Swap It'],
    ['rent', 'Rent It Out'],
  ]

  const spots = h.campusSpots.map((s) => s.name)
  const spotKnown = spots.includes(f.spot)

  return (
    <div className="screen">
      <AppHeader kicker="Step 2 of 2" title="Details" onBack={h.toStep1} />

      <AppBody>
        {/* the accelerator, opt-in — see the note above */}
        {!sentence ? (
          <button
            onClick={() => setSentence(true)}
            className="btn btn-ghost"
            style={{ fontSize: 12.5, paddingInline: 0, marginBottom: 4 }}
          >
            Rather type it as a sentence? →
          </button>
        ) : (
          <div className="field">
            <label>Say it how you would text a friend — the fields fill themselves in</label>
            <textarea
              className="input"
              value={h.postText}
              onChange={(e) => h.setPostText(e.target.value)}
              placeholder="giving away my ikea desk lamp, barely used, bulb still in it. leaving friday so grab it tonight at the front desk"
              style={{ minHeight: 84 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {!h.postText.trim() && (
                <button onClick={h.useExample} className="btn btn-ghost" style={{ fontSize: 12.5, paddingInline: 0 }}>
                  Use an example →
                </button>
              )}
              <button
                onClick={() => setSentence(false)}
                className="btn btn-ghost"
                style={{ fontSize: 12.5, paddingInline: 0, marginLeft: 'auto' }}
              >
                Hide
              </button>
            </div>
            <div className="app-hr" />
          </div>
        )}

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
          <label>Brand</label>
          <input className="input" value={f.brand} onChange={(e) => h.setField('brand', e.target.value)} placeholder="IKEA" />
        </div>

        <div className="field">
          <label>Item</label>
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
          <label>Size or Dimensions (if applicable)</label>
          <input
            className="input"
            value={f.dimensions}
            onChange={(e) => h.setField('dimensions', e.target.value)}
            placeholder="5x7ft or 100 ml or Large"
          />
        </div>

        <div className="field">
          <label>Description (optional)</label>
          <textarea
            className="input"
            value={f.description}
            onChange={(e) => h.setField('description', e.target.value)}
            placeholder="Anything useful for the next owner to know."
          />
        </div>

        {/* how it moves */}
        <div className="field">
          <label>Deal Method</label>
          <div className="app-choice">
            {kinds.map(([k, label]) => {
              const soon = KIND_STATUS[k] === 'soon'
              return (
                <button
                  key={k}
                  onClick={() =>
                    soon
                      ? h.flash('Renting opens once returns are handled properly. Everything else is live now.')
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

        {/* a list to pick from, because a place two people can both find is
            worth more than a place one person can describe */}
        <div className="field">
          <label>Meet-Up</label>
          <select
            className="input"
            value={elsewhere || (f.spot && !spotKnown) ? '__other' : f.spot}
            onChange={(e) => {
              if (e.target.value === '__other') {
                setElsewhere(true)
                h.setField('spot', '')
              } else {
                setElsewhere(false)
                h.setField('spot', e.target.value)
              }
            }}
          >
            <option value="">Pick a spot on campus…</option>
            {spots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="__other">Somewhere else…</option>
          </select>
          {(elsewhere || (f.spot && !spotKnown)) && (
            <input
              className="input"
              value={f.spot}
              onChange={(e) => h.setField('spot', e.target.value)}
              placeholder="Somewhere public on campus"
              style={{ marginTop: 8 }}
            />
          )}
          <div className="field__hint">Somewhere public on campus. Never a room number.</div>
        </div>

        {/* Tessa struck this on 28 Aug as decision fatigue, and she was right
            about its weight — it was a bold heading over a three-line
            paragraph. It is not removed, because this is the only place the
            flag can be set, and student carriers are the whole answer to
            "what about the heavy things" without a van in it. One line. */}
        <label className="app-check app-check--slim">
          <input type="checkbox" checked={h.needsHelp} onChange={(e) => h.setNeedsHelp(e.target.checked)} />
          <span>Needs two people or a trolley — show it to students who carry for a few dollars</span>
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
          {h.busy ? 'Posting…' : blocked ? 'Cannot post this' : 'Post to Marketplace'}
        </button>
      </AppFooter>
    </div>
  )
}
