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

export type Tab = 'free' | 'sale' | 'wanted'

export type ListingStatus = 'active' | 'paused' | 'gone'

/** A listing on the campus board. Live rows carry `uuid` (the DB id); the
 *  numeric `id` is a stable hash used as a React key and for local lookups. */
export interface Item {
  id: number
  uuid?: string
  free: boolean
  price?: number
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
}

/** The three fields the parse produces that a user can override in one tap. */
export type EditField = 'title' | 'price' | 'spot'

/** What the paragraph parser reads out of the user's one sentence. */
export interface ParseResult {
  title: string
  free: boolean
  price: number
  cat: string
  cond: string
  spot: string
  when: string
  empty: boolean
}
