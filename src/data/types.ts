export type Screen =
  | 'rules'
  | 'how'
  | 'gate'
  | 'browse'
  | 'detail'
  | 'claim'
  | 'chat'
  | 'chats'
  | 'post1'
  | 'post2'
  | 'posted'
  | 'me'

export type Tab = 'free' | 'sale' | 'rent' | 'trade' | 'wanted'

/**
 * How the object moves. Three of these are transfers — the object changes owner
 * — and one, `rent`, is a loan that comes back, which is why the impact model
 * treats it differently (see lib/impact.ts).
 */
export type ListingKind = 'free' | 'sale' | 'trade' | 'rent'

export type ListingStatus = 'active' | 'paused' | 'gone'

/** A listing on the campus board. Live rows carry `uuid` (the DB id); the
 *  numeric `id` is a stable hash used as a React key and for local lookups. */
export interface Item {
  id: number
  uuid?: string
  kind: ListingKind
  free: boolean
  price?: number
  /** `trade`: what the owner wants instead. */
  tradeFor?: string
  /** `rent`: the rate and the period it covers. */
  rentRate?: number
  rentPeriod?: string
  title: string
  cat: string
  cond: string
  loc: string
  ago: string
  seller: string
  sellerId?: string
  handoffs: number
  since: string
  spot: string
  desc: string
  photoUrl?: string | null
  status?: ListingStatus
  ageDays?: number
  mine?: boolean
}

export interface Wanted {
  id: number
  uuid?: string
  authorId?: string
  title: string
  who: string
  ago: string
  handoffs: number
}

export interface SpotType {
  name: string
  why: string
}

export interface CampusSpot {
  name: string
  uses: number
}

export interface Message {
  id: number
  who: 'me' | 'them'
  text: string
}

/** One row in the Chats list. */
export interface ThreadSummary {
  id: string
  otherName: string
  otherHandoffs: number
  listingTitle: string
  spotName: string
  pickupWindow: string
  lastMessage: string
  /** The confirmation loop: each side taps once, the second tap counts it. */
  myDone: boolean
  theirDone: boolean
  completed: boolean
}

/** The signed-in user as the screens consume it. */
export interface MeProfile {
  name: string
  initials: string
  email: string
  since: string
  handoffs: number
  noShows: number
  building: string
  /** Where they prefer to hand things over — public, on campus. */
  preferredSpot: string
}

/** The three fields the parse produces that a user can override in one tap. */
export type EditField = 'title' | 'price' | 'spot'

/** What the paragraph parser reads out of the user's one sentence. */
export interface ParseResult {
  title: string
  kind: ListingKind
  free: boolean
  price: number
  tradeFor: string
  rentRate: number
  rentPeriod: string
  cat: string
  cond: string
  spot: string
  when: string
  empty: boolean
}
