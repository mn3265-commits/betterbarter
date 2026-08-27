import { Reveal } from './Reveal'

/**
 * The EPA's non-hazardous materials management hierarchy, drawn honestly.
 *
 * Most campus sustainability work happens two or three steps down this ladder —
 * recycling bins, waste audits, hauling contracts. Reuse sits at the top, above
 * recycling, because nothing is reprocessed and nothing is transported: the
 * object simply keeps being the object. Drawing it is the fastest way to show
 * where a reuse board sits relative to everything a campus already does.
 *
 * The width of each rung is a rhetorical figure, not a measurement — it says
 * "most preferred to least", which is exactly what the hierarchy says.
 */
const RUNGS: [string, string, boolean][] = [
  ['Source reduction & reuse', 'Nothing is made, nothing is reprocessed, nothing is driven anywhere.', true],
  ['Recycling & composting', 'The material survives; the object does not. Collection and reprocessing both cost energy.', false],
  ['Energy recovery', 'Burned, with some of the energy captured.', false],
  ['Treatment & disposal', 'The dumpster at the end of a hallway in May.', false],
]

export function Hierarchy() {
  return (
    <Reveal>
      <div className="hier">
        {RUNGS.map(([title, body, ours], i) => (
          <div key={title} className={'hier__rung' + (ours ? ' is-ours' : '')} style={{ width: 100 - i * 12 + '%' }}>
            <div className="hier__title">
              {title}
              {ours && <span className="hier__badge">Handoff is here</span>}
            </div>
            <div className="hier__body">{body}</div>
          </div>
        ))}
        <div className="hier__axis">
          <span>Most preferred</span>
          <span>Least preferred</span>
        </div>
      </div>
    </Reveal>
  )
}
