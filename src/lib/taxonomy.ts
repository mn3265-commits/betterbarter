/**
 * The fixed vocabularies the team agreed on 26 August.
 *
 * Categories and conditions are picked, not typed. Browsing only works if two
 * people describing the same object land in the same place — "desk lamp" and
 * "IKEA lamp white" have to end up under one heading or the Marketplace cannot be
 * searched, filtered, or measured. The parser still reads a sentence; these are
 * what it has to choose between.
 */

export const CATEGORIES = [
  'Textbooks & Course Materials',
  'Electronics',
  'Furniture & Dorm Essentials',
  'Fashion & Accessories',
  'Tickets & Events',
  'Family & Kids',
  'Regalia',
  'Others',
] as const
export type Category = (typeof CATEGORIES)[number]

export const CONDITIONS = [
  'Brand New',
  'Like New',
  'Lightly Used',
  'Well Used',
  'Heavily Used (Repair Needed)',
] as const
export type Condition = (typeof CONDITIONS)[number]

/** Up to four photos per listing — the team's number, and the one a phone can
 *  shoot without the posting turning into a job. */
export const MAX_PHOTOS = 3

/**
 * Which ways of listing are open, and which are announced.
 *
 * Renting is built end to end, but it needs a second meeting to bring the thing
 * back, and the team's call on 26 August was to keep that out of the first
 * release. Hiding it entirely was the wrong way to do that: it made the product
 * look like it had three ideas when it has four. So renting stays on the Marketplace,
 * visibly, marked as not open yet — which also tells us who wants it before we
 * finish it.
 */
export type KindStatus = 'live' | 'soon'

export const KIND_STATUS: Record<'free' | 'sale' | 'trade' | 'rent', KindStatus> = {
  free: 'live',
  sale: 'live',
  trade: 'live',
  rent: 'soon',
}

export const isLiveKind = (kind: string) => KIND_STATUS[kind as 'free'] !== 'soon'

/** Kept as a compatibility shim for anything still asking the old question. */
export const KINDS_ENABLED = {
  free: true,
  sale: true,
  trade: true,
  rent: KIND_STATUS.rent === 'live',
}

/** The category the old free-text values map onto, so nothing already posted
 *  falls off the Marketplace when the vocabulary changes under it. */
const LEGACY: Record<string, Category> = {
  Books: 'Textbooks & Course Materials',
  Tech: 'Electronics',
  Furniture: 'Furniture & Dorm Essentials',
  Lamp: 'Furniture & Dorm Essentials',
  Kitchen: 'Furniture & Dorm Essentials',
  Supplies: 'Furniture & Dorm Essentials',
  Bath: 'Furniture & Dorm Essentials',
  Clothes: 'Fashion & Accessories',
  Bike: 'Others',
  Other: 'Others',
}

export function toCategory(value: string | undefined | null): Category {
  if (!value) return 'Others'
  if ((CATEGORIES as readonly string[]).includes(value)) return value as Category
  return LEGACY[value] ?? 'Others'
}

export function toCondition(value: string | undefined | null): Condition {
  if (!value) return 'Lightly Used'
  if ((CONDITIONS as readonly string[]).includes(value)) return value as Condition
  const v = value.toLowerCase()
  if (v.includes('new')) return v.includes('like') ? 'Like New' : 'Brand New'
  if (v.includes('repair') || v.includes('broken')) return 'Heavily Used (Repair Needed)'
  if (v.includes('well') || v.includes('worn') || v.includes('scuff') || v.includes('dent')) return 'Well Used'
  return 'Lightly Used'
}

/**
 * The icon each category wears, by lucide name. Categories are a fixed
 * vocabulary now, so they can carry a fixed mark — which is what makes a board
 * scannable at a glance rather than a wall of titles.
 */
/**
 * A colour per category, in this exact order.
 *
 * Six hues that a colourblind reader can still tell apart — checked with the
 * palette validator rather than by eye, adjacent-pair by adjacent-pair, at the
 * order they actually appear in. Every use also carries the icon and the name,
 * so colour is never the only thing carrying the meaning.
 */
export const CATEGORY_COLOR: Record<Category, string> = {
  'Textbooks & Course Materials': '#1c7a4f',
  Electronics: '#5b53c9',
  'Furniture & Dorm Essentials': '#6b7a12',
  'Fashion & Accessories': '#1e40af',
  'Tickets & Events': '#a3197a',
  'Family & Kids': '#0f766e',
  Regalia: '#c2410c',
  Others: '#1f6f9c',
}

export const CATEGORY_ICON: Record<Category, string> = {
  'Textbooks & Course Materials': 'BookOpen',
  Electronics: 'Laptop',
  'Furniture & Dorm Essentials': 'Lamp',
  'Fashion & Accessories': 'Shirt',
  'Tickets & Events': 'Ticket',
  'Family & Kids': 'Baby',
  Regalia: 'GraduationCap',
  Others: 'Package',
}


/**
 * Where a handoff happens, on Tessa's list of 30 August.
 *
 * Every one of these is a place two strangers can both find and neither has to
 * explain, which is the whole requirement. Deliberately public and deliberately
 * not residential: the rules say never a room, and a list that offers one would
 * be the product arguing with itself.
 *
 * Morningside only for now. SIPA, Barnard and Teachers College are the next
 * ones in, once there is anyone on the Marketplace from them.
 */
export const CAMPUS_SPOTS = [
  // Tessa, 31 Aug: keep these at the building level and let the two of them
  // agree the door in conversation. A list with "Butler Library entrance" and
  // "Butler Library steps" on it makes people choose between two answers that
  // are the same answer.
  //
  // Alphabetical, with the escape hatch first so nobody scrolls looking for it.
  'Somewhere else',
  'Avery Library',
  'Butler Library',
  'Carman Hall',
  'Columbia University — Amsterdam gates',
  'Columbia University — Broadway gates',
  'John Jay Hall',
  'Lerner Hall',
  'Low Library',
  'Uris Hall',
] as const
