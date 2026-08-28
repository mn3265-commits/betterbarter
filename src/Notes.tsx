import type { SwapUp } from './lib/useSwapUp'

const CUT = [
  ['Payments', 'The handoff happens in a lobby, on Venmo. You cannot see it, so you cannot charge it.'],
  ['Deposits', 'Lending is a promise between two verified students. We hold nothing and adjudicate nothing.'],
  ['Logistics', 'No collection, no storage, no van. That is what makes reuse cost more than it saves.'],
  ['Many campuses at once', 'A school joins by someone signing in. Our attention goes to one campus at a time — dense before wide.'],
]

const EARNS = [
  ['Photo, then a paragraph', 'No form — the app reads price and category out of your words'],
  ['Spot rules, not a spot list', 'Students name the place; never a room'],
  ['SwapUp count', 'Reputation as credit history'],
  ['Mark as gone', 'Dead listings kill a board'],
  ['Wanted posts', 'A full board with zero inventory'],
  ['Four ways to move it', 'Give, sell, lend, swap — one board, one confirmation'],
  ['Move-out mode', 'May is the whole business'],
]

/**
 * The left-hand design-rationale column. Not part of the product — presentation
 * only — but it carries the scope story and the "walk the flow" jump buttons.
 */
export function Notes({ h }: { h: SwapUp }) {
  return (
    <div className="notes">
      <div className="notes__kicker">Scope · v1 · Columbia trial</div>
      <h1>SwapUp</h1>
      <p className="notes__lede">
        A handoff board for one campus. You post what you are done with, someone else on campus takes it — nearest
        first. Verified by school email — that is the whole product. Every campus is its own board, and the first one is
        Columbia.
      </p>
      <hr className="hr" />

      <h6 style={{ margin: '0 0 10px' }}>Cut from the board</h6>
      <table className="table">
        <tbody>
          {CUT.map(([k, v]) => (
            <tr key={k}>
              <td style={{ width: '34%', fontWeight: 600 }}>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="hr" />
      <h6 style={{ margin: '0 0 10px' }}>What earns its place</h6>
      <div className="notes__grid">
        {EARNS.map(([k, v]) => (
          <div key={k} className="notes__cell">
            <b>{k}</b>
            <span>{v}</span>
          </div>
        ))}
        <div className="notes__cell" style={{ gridColumn: '1 / -1' }}>
          <b>Both-sides confirmation</b>
          <span>
            The handoff only counts when both people tap it in the thread. That second tap closes the listing, ends the
            hold and adds +1 to each public handoff count — the one number this product runs on.
          </span>
        </div>
        <div className="notes__cell" style={{ gridColumn: '1 / -1' }}>
          <b>Day-7 freshness check</b>
          <span>
            A week old and the app asks: still there? Silence pauses the listing, so the board can never fill with things
            that are already gone.
          </span>
        </div>
      </div>

      <hr className="hr" />
      <h6 style={{ margin: '0 0 10px' }}>Money, before the handshake</h6>
      <p style={{ fontSize: 14, margin: '0 0 14px', maxWidth: '46ch', textWrap: 'pretty' }}>
        Everything charged here is paid <em>before</em> a deal exists, so nobody can route around it: a bump to the top
        of the board, a verified-audience slot for movers and storage, club accounts with real budgets.
      </p>

      <h6 style={{ margin: '22px 0 10px' }}>Walk the flow</h6>
      <div className="notes__jump">
        <button className="btn btn-secondary" onClick={() => h.go('gate')}>
          1 · Gate
        </button>
        <button className="btn btn-secondary" onClick={h.jumpBrowse}>
          2 · Board
        </button>
        <button className="btn btn-secondary" onClick={() => h.openDetail(2)}>
          3 · Listing
        </button>
        <button className="btn btn-secondary" onClick={h.jumpClaim}>
          4 · Meetup
        </button>
        <button className="btn btn-secondary" onClick={h.jumpChat}>
          5 · Chat
        </button>
        <button className="btn btn-secondary" onClick={h.startPost}>
          6 · Post
        </button>
        <button className="btn btn-secondary" onClick={h.jumpWanted}>
          7 · Wanted
        </button>
        <button className="btn btn-secondary" onClick={h.jumpMe}>
          8 · Me
        </button>
      </div>
      <p className="notes__foot">The prototype is live — claim something, send a message, post a lamp, mark it gone.</p>
    </div>
  )
}
