/**
 * The fixed vocabularies the team agreed on 26 August.
 *
 * Categories and conditions are picked, not typed. Browsing only works if two
 * people describing the same object land in the same place — "desk lamp" and
 * "IKEA lamp white" have to end up under one heading or the board cannot be
 * searched, filtered, or measured. The parser still reads a sentence; these are
 * what it has to choose between.
 */

export const CATEGORIES = [
  'Textbooks & Course Materials',
  'Electronics',
  'Furniture & Dorm Essentials',
  'Fashion & Accessories',
  'Tickets & Events',
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
export const MAX_PHOTOS = 4

/**
 * Which ways of listing are open right now.
 *
 * Renting is built end to end, but it needs a second meeting to bring the thing
 * back, and Tessa's call on 26 August was to leave that out of the first
 * release rather than explain it to a first-time user. Flip the flag when the
 * board is busy enough for lending to be worth the extra step.
 */
export const KINDS_ENABLED = { free: true, sale: true, trade: true, rent: false }

/** The category the old free-text values map onto, so nothing already posted
 *  falls off the board when the vocabulary changes under it. */
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
  Electronics: '#c2410c',
  'Furniture & Dorm Essentials': '#1f6f9c',
  'Fashion & Accessories': '#6b7a12',
  'Tickets & Events': '#a3197a',
  Others: '#5b53c9',
}

export const CATEGORY_ICON: Record<Category, string> = {
  'Textbooks & Course Materials': 'BookOpen',
  Electronics: 'Laptop',
  'Furniture & Dorm Essentials': 'Lamp',
  'Fashion & Accessories': 'Shirt',
  'Tickets & Events': 'Ticket',
  Others: 'Package',
}
