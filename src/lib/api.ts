import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Item, Message, Tab } from '../data/types'
import { supabase } from './supabase'

/**
 * Supabase-backed data layer. Every function assumes the caller has already
 * checked `isBackendConfigured` (so `supabase` is non-null). Row-level security
 * scopes all of this to the signed-in user's campus — see the migrations.
 *
 * This module maps database rows to the app's existing view types (`Item`,
 * `Message`) so the screens do not need to change shape when they switch from
 * seed data to live data.
 */

function db() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

// ── shapes coming back from Postgres ──────────────────────────────────────────
interface ListingRow {
  id: string
  seller_id: string
  title: string
  description: string
  is_free: boolean
  price: number | null
  category: string
  condition: string
  building: string | null
  spot_name: string
  status: 'active' | 'paused' | 'gone'
  created_at: string
  confirmed_at: string | null
  day7_prompt_at: string | null
  seller?: { name: string; handoffs: number; joined_at: string } | null
}

/** "18m" / "3h" / "2d" — a compact age from a timestamp. */
export function ago(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return mins + 'm'
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + 'h'
  return Math.floor(hrs / 24) + 'd'
}

/** A stable positive int id derived from a listing uuid, for the seed-shaped Item. */
function numId(uuid: string): number {
  let h = 0
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0
  return Math.abs(h)
}

const uuidById = new Map<number, string>()

/** Map a DB row to the app's `Item`, remembering the uuid behind the numeric id. */
function toItem(r: ListingRow): Item {
  const id = numId(r.id)
  uuidById.set(id, r.id)
  return {
    id,
    free: r.is_free,
    price: r.price ?? undefined,
    title: r.title,
    cat: r.category,
    cond: r.condition,
    loc: r.building ?? '',
    ago: ago(r.created_at),
    seller: r.seller?.name ?? 'Someone',
    handoffs: r.seller?.handoffs ?? 0,
    since: r.seller?.joined_at ? new Date(r.seller.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
    spot: r.spot_name,
    desc: r.description,
  }
}

/** Recover the real listing uuid for an app-side numeric id. */
export function listingUuid(id: number): string | undefined {
  return uuidById.get(id)
}

// ── auth ──────────────────────────────────────────────────────────────────────

/** Send a magic-link / OTP to a school email. Sign-up is gated to enrolled
 *  campus domains by the handle_new_user() trigger. */
export async function signInWithEmail(email: string) {
  const { error } = await db().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  await db().auth.signOut()
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await db().auth.getUser()
  return data.user?.id ?? null
}

// ── board ─────────────────────────────────────────────────────────────────────

const SELLER_JOIN = 'seller:profiles!listings_seller_id_fkey (name, handoffs, joined_at)'

/** The live board for a tab, newest first. RLS already limits it to the campus
 *  and to active listings (plus the viewer's own). */
export async function fetchBoard(tab: Tab, query: string): Promise<Item[]> {
  let q = db()
    .from('listings')
    .select(`id, seller_id, title, description, is_free, price, category, condition, building, spot_name, status, created_at, confirmed_at, day7_prompt_at, ${SELLER_JOIN}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (tab === 'free') q = q.eq('is_free', true)
  else if (tab === 'sale') q = q.eq('is_free', false)

  const { data, error } = await q
  if (error) throw error
  const rows = (data ?? []) as unknown as ListingRow[]
  const needle = query.trim().toLowerCase()
  return rows
    .map(toItem)
    .filter((it) => !needle || (it.title + ' ' + it.cat).toLowerCase().includes(needle))
}

// ── posting ───────────────────────────────────────────────────────────────────

export interface NewListing {
  title: string
  free: boolean
  price: number | null
  category: string
  condition: string
  spotName: string
  building: string
  description: string
  photoPath?: string
}

export async function createListing(input: NewListing, campusId: string, sellerId: string): Promise<void> {
  const { error } = await db()
    .from('listings')
    .insert({
      campus_id: campusId,
      seller_id: sellerId,
      title: input.title,
      description: input.description,
      is_free: input.free,
      price: input.free ? null : input.price,
      category: input.category,
      condition: input.condition,
      building: input.building,
      spot_name: input.spotName,
      photo_path: input.photoPath ?? null,
    })
  if (error) throw error
}

/** Upload a listing photo to the public `listing-photos` bucket; returns its path. */
export async function uploadPhoto(file: File, userId: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}-${file.name}`
  const { error } = await db().storage.from('listing-photos').upload(path, file)
  if (error) throw error
  return path
}

// ── claim → thread → chat ─────────────────────────────────────────────────────

/** Create the thread on claim, seed the two opening messages, start the 3-hour
 *  hold, and return the thread id. */
export async function claim(args: {
  listingUuid: string
  campusId: string
  buyerId: string
  sellerId: string
  spotName: string
  pickupWindow: string
  buyerText: string
  sellerText: string
}): Promise<string> {
  const holdExpires = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
  const { data, error } = await db()
    .from('threads')
    .insert({
      campus_id: args.campusId,
      listing_id: args.listingUuid,
      buyer_id: args.buyerId,
      seller_id: args.sellerId,
      spot_name: args.spotName,
      pickup_window: args.pickupWindow,
      hold_expires_at: holdExpires,
    })
    .select('id')
    .single()
  if (error) throw error
  const threadId = (data as { id: string }).id
  await db().from('messages').insert([
    { thread_id: threadId, sender_id: args.buyerId, body: args.buyerText },
    { thread_id: threadId, sender_id: args.sellerId, body: args.sellerText },
  ])
  return threadId
}

export async function sendMessage(threadId: string, senderId: string, body: string): Promise<void> {
  const { error } = await db().from('messages').insert({ thread_id: threadId, sender_id: senderId, body })
  if (error) throw error
}

export async function fetchMessages(threadId: string, meId: string): Promise<Message[]> {
  const { data, error } = await db()
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((m, i) => ({
    id: i + 1,
    who: (m as { sender_id: string }).sender_id === meId ? 'me' : 'them',
    text: (m as { body: string }).body,
  }))
}

/** Live-subscribe to new messages on a thread. Returns the channel so the caller
 *  can unsubscribe. */
export function subscribeMessages(threadId: string, onInsert: (m: { sender_id: string; body: string }) => void): RealtimeChannel {
  const channel = db()
    .channel(`messages:${threadId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
      (payload) => onInsert(payload.new as { sender_id: string; body: string }),
    )
    .subscribe()
  return channel
}

// ── day-7 lifecycle ───────────────────────────────────────────────────────────

export async function setListingStatus(uuid: string, status: 'active' | 'paused' | 'gone'): Promise<void> {
  const { error } = await db().from('listings').update({ status }).eq('id', uuid)
  if (error) throw error
}

export async function confirmStillHere(uuid: string): Promise<void> {
  const { error } = await db()
    .from('listings')
    .update({ confirmed_at: new Date().toISOString(), status: 'active' })
    .eq('id', uuid)
  if (error) throw error
}

export async function makeListingFree(uuid: string): Promise<void> {
  const { error } = await db().from('listings').update({ is_free: true, price: null }).eq('id', uuid)
  if (error) throw error
}
