import type { CampusSpot, Item, SpotType, Wanted } from './types'

/**
 * Seeded campus data. In production this is a paginated campus feed and a
 * per-campus meetup-spot list with use counts — here it stands in for both.
 */

export const SPOTS: SpotType[] = [
  { name: 'A library entrance', why: 'Everyone on campus knows where it is, and it is open late' },
  { name: 'A dining hall entrance', why: 'Busy until closing, easy to describe' },
  { name: 'A student centre or department lobby', why: 'Indoor, staffed, and on everyone’s way somewhere' },
  { name: 'A main gate or quad', why: 'Open air, and wide enough for furniture' },
]

/** Built by students at the school, not by us — starts empty, fills after handoffs. */
export const CAMPUS_SPOTS: CampusSpot[] = [
  { name: 'Carman front desk', uses: 34 },
  { name: 'John Jay dining doors', uses: 21 },
  { name: 'Butler steps', uses: 12 },
]

export const WINDOWS = ['Today 6–8pm', 'Tomorrow 12–2pm', 'Sunday 4–6pm']

export const ITEMS: Item[] = [
  { id: 1, kind: 'free', free: true, title: 'Mini fridge, 3.2 cu ft', cat: 'Kitchen', cond: 'Works, one dent', loc: 'Carman 6', ago: '18m', seller: 'Tesia O.', handoffs: 9, since: 'Sep 2023', spot: 'Carman front desk', desc: 'Bought it freshman year, cooled everything I ever put in it. Small dent on the door from move-in. Taking the first person who can carry it down one flight.' },
  { id: 2, kind: 'free', free: true, title: 'IKEA desk lamp', cat: 'Lamp', cond: 'Like new', loc: 'Carman 4', ago: '42m', seller: 'Marcus L.', handoffs: 4, since: 'Sep 2024', spot: 'Carman front desk', desc: 'White FORSÅ, bulb included. I am switching to a floor lamp. Free, just take it before Friday.' },
  { id: 3, kind: 'free', free: true, title: 'Full-length mirror', cat: 'Furniture', cond: 'Frame scuffed', loc: 'John Jay 9', ago: '2h', seller: 'Priya R.', handoffs: 15, since: 'Sep 2022', spot: 'John Jay dining doors', desc: 'Leans against the wall, no mounting needed. The frame has scuffs, the glass is perfect.' },
  { id: 4, kind: 'free', free: true, title: 'Moving boxes, six of them', cat: 'Supplies', cond: 'Used once', loc: 'Carman 2', ago: '3h', seller: 'Dan K.', handoffs: 2, since: 'Sep 2025', spot: 'Carman front desk', desc: 'Six large boxes, flattened, plus most of a roll of tape. Somebody is going to need these next week.' },
  { id: 5, kind: 'free', free: true, title: 'Shower caddy + drying rack', cat: 'Bath', cond: 'Clean', loc: 'Wallach 3', ago: '5h', seller: 'Ana G.', handoffs: 6, since: 'Sep 2024', spot: 'Butler steps', desc: 'Mesh caddy and a folding rack. Both washed. Free to a first-year who has not bought these yet.' },
  { id: 6, kind: 'free', free: true, title: 'Rug, 5 × 7, grey', cat: 'Furniture', cond: 'Vacuumed', loc: 'Carman 8', ago: '7h', seller: 'Tesia O.', handoffs: 9, since: 'Sep 2023', spot: 'Carman front desk', desc: 'Covers most of a Carman double. Rolled and tied, heavier than it looks — bring a friend.' },
  { id: 7, kind: 'sale', free: false, price: 40, title: 'Standing desk converter', cat: 'Furniture', cond: 'Good', loc: 'Broadway 12', ago: '1h', seller: 'Yusuf A.', handoffs: 11, since: 'Sep 2023', spot: 'Lerner ramp, level 3', desc: 'Sits on a normal desk and cranks up. Paid $120 for it last year. Firm at $40, it saved my back.' },
  { id: 8, kind: 'sale', free: false, price: 55, title: '24-inch monitor, HDMI', cat: 'Tech', cond: 'No dead pixels', loc: 'Carman 5', ago: '4h', seller: 'Marcus L.', handoffs: 4, since: 'Sep 2024', spot: 'Carman front desk', desc: 'Dell, 1080p, HDMI cable included. I am upgrading to an ultrawide. No dead pixels.' },
  { id: 9, kind: 'sale', free: false, price: 15, title: 'Rice cooker, 3 cup', cat: 'Kitchen', cond: 'Works', loc: 'John Jay 7', ago: '6h', seller: 'Priya R.', handoffs: 15, since: 'Sep 2022', spot: 'John Jay dining doors', desc: 'Fed me for two years. Inner pot has no scratches. Graduating and cannot fly with it.' },
  { id: 11, kind: 'rent', free: false, rentRate: 5, rentPeriod: 'week', title: 'Power drill + bit set', cat: 'Supplies', cond: 'Works', loc: 'Wallach 5', ago: '2h', seller: 'Ana G.', handoffs: 6, since: 'Sep 2024', spot: 'Butler steps', desc: 'Nobody needs to own a drill for one shelf. Borrow it for a week and bring it back charged.' },
  { id: 12, kind: 'trade', free: false, tradeFor: 'a desk fan or a kettle', title: 'Space heater, 1500W', cat: 'Kitchen', cond: 'Good', loc: 'John Jay 4', ago: '5h', seller: 'Yusuf A.', handoffs: 11, since: 'Sep 2023', spot: 'John Jay dining doors', desc: 'Warm room, wrong season. Would rather swap it than sell it — looking for a desk fan or a kettle.' },
  { id: 10, kind: 'sale', free: false, price: 12, title: 'U-lock, two keys', cat: 'Bike', cond: 'Solid', loc: 'Carman 3', ago: '9h', seller: 'Dan K.', handoffs: 2, since: 'Sep 2025', spot: 'Carman front desk', desc: 'Kryptonite U-lock, both keys, no rust. My bike got stolen with a cable lock, so learn from me.' },
]

export const WANTED: Wanted[] = [
  { id: 101, title: 'Box fan — under $15', who: 'Léa M.', ago: '20m', handoffs: 3 },
  { id: 102, title: 'Mini fridge, any condition', who: 'Sam T.', ago: '1h', handoffs: 7 },
  { id: 103, title: 'Full-length mirror', who: 'Ify E.', ago: '3h', handoffs: 1 },
  { id: 104, title: 'Desk chair that rolls', who: 'Jonah P.', ago: '5h', handoffs: 12 },
]

/** Demo: two of my listings have gone stale (day-7 freshness check). */
export const AGE_DAYS: Record<number, number> = { 7: 9, 8: 13 }

/** No reply to the day-7 check — auto-paused. */
export const AUTO_PAUSED = [8]

/** The signed-in user. */
export const ME = {
  name: 'Ajayi N.',
  initials: 'AN',
  email: 'an3421@columbia.edu',
  since: 'Sep 2024',
  handoffs: 12,
  noShows: 0,
  building: 'Carman 6',
  preferredSpot: 'Butler steps',
}

export const CAMPUS = 'Columbia'
