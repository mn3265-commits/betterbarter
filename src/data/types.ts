export type Screen =
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

/** A single listing on the campus board. */
export interface Item {
  id: number
  free: boolean
  price?: number
  title: string
  cat: string
  cond: string
  loc: string
  ago: string
  seller: string
  handoffs: number
  since: string
  spot: string
  desc: string
}

export interface Wanted {
  id: number
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
