import type { RealtimeChannel } from '@supabase/supabase-js'
import type { CampusSpot, Item, ListingKind, ListingStatus, Message, ThreadSummary, Wanted } from '../data/types'
import { supabase } from './supabase'

/**
 * Supabase-backed data layer. Row-level security scopes every read to the
 * signed-in user's campus (see supabase/migrations), so none of these queries
 * filter by campus themselves except where a write needs the id.
 *
 * Joins are done in JS rather than with PostgREST embeds: one query for the
 * rows, one for the related profiles. It costs a round trip but does not depend
 * on foreign-key constraint naming, which makes it far harder to break.
 */

function db() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

const PHOTO_BUCKET = 'listing-photos'

/** "just now" / "18m" / "3h" / "2d" — a compact age from a timestamp. */
export function ago(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (secs < 90) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return mins + 'm'
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + 'h'
  return Math.floor(hrs / 24) + 'd'
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

/** A stable positive int derived from a uuid, so existing screens can keep
 *  using numeric ids as keys. */
export function numId(uuid: string): number {
  let h = 0
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0
  return Math.abs(h)
}

function monthYear(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ── rows ──────────────────────────────────────────────────────────────────────

interface ListingRow {
  id: string
  seller_id: string
  title: string
  description: string
  kind: ListingKind
  is_free: boolean
  price: number | null
  trade_for: string | null
  rent_rate: number | null
  rent_period: string | null
  category: string
  condition: string
  building: string | null
  spot_name: string
  status: ListingStatus
  photo_path: string | null
  created_at: string
  confirmed_at: string | null
}

interface ProfileRow {
  id: string
  name: string
  handoffs: number
  joined_at: string | null
}

async function profilesByIds(ids: string[]): Promise<Map<string, ProfileRow>> {
  const unique = Array.from(new Set(ids)).filter(Boolean)
  const map = new Map<string, ProfileRow>()
  if (!unique.length) return map
  const { data } = await db().from('profiles').select('id, name, handoffs, joined_at').in('id', unique)
  for (const p of (data ?? []) as ProfileRow[]) map.set(p.id, p)
  return map
}

export function photoUrl(path: string | null): string | null {
  if (!path) return null
  return db().storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}

function toItem(r: ListingRow, seller: ProfileRow | undefined, meId: string | null): Item {
  // The freshness clock restarts whenever the owner confirms the listing.
  const clock = r.confirmed_at ?? r.created_at
  return {
    id: numId(r.id),
    uuid: r.id,
    kind: r.kind ?? (r.is_free ? 'free' : 'sale'),
    free: r.is_free,
    price: r.price ?? undefined,
    tradeFor: r.trade_for ?? undefined,
    rentRate: r.rent_rate ?? undefined,
    rentPeriod: r.rent_period ?? undefined,
    title: r.title,
    cat: r.category,
    cond: r.condition,
    loc: r.building ?? '',
    ago: ago(r.created_at),
    seller: seller?.name ?? 'Someone on campus',
    sellerId: r.seller_id,
    handoffs: seller?.handoffs ?? 0,
    since: monthYear(seller?.joined_at ?? null),
    spot: r.spot_name,
    desc: r.description,
    photoUrl: photoUrl(r.photo_path),
    status: r.status,
    ageDays: daysSince(clock),
    mine: meId != null && r.seller_id === meId,
  }
}

// ── campus ────────────────────────────────────────────────────────────────────

export async function fetchCampusName(): Promise<string> {
  const { data } = await db().from('campuses').select('name').limit(1).maybeSingle()
  return (data as { name: string } | null)?.name ?? 'campus'
}

export async function fetchSpots(): Promise<CampusSpot[]> {
  const { data } = await db().from('meetup_spots').select('name, uses').order('uses', { ascending: false })
  return (data ?? []) as CampusSpot[]
}

/** Record that a spot was used, creating it the first time. This is how the
 *  per-campus spot list builds itself out of real handoffs. */
export async function bumpSpot(campusId: string, name: string): Promise<void> {
  const clean = name.trim()
  if (!clean) return
  const { data } = await db().from('meetup_spots').select('id, uses').eq('name', clean).maybeSingle()
  const row = data as { id: string; uses: number } | null
  if (row) await db().from('meetup_spots').update({ uses: row.uses + 1 }).eq('id', row.id)
  else await db().from('meetup_spots').insert({ campus_id: campusId, name: clean, uses: 1 })
}

// ── board ─────────────────────────────────────────────────────────────────────

const LISTING_COLS =
  'id, seller_id, title, description, kind, is_free, price, trade_for, rent_rate, rent_period, category, condition, building, spot_name, status, photo_path, created_at, confirmed_at'

/** Everything the viewer may see: active listings on their campus, plus their
 *  own paused/gone ones (RLS enforces both). */
export async function fetchListings(meId: string | null): Promise<Item[]> {
  const { data, error } = await db()
    .from('listings')
    .select(LISTING_COLS)
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (data ?? []) as ListingRow[]
  const profiles = await profilesByIds(rows.map((r) => r.seller_id))
  return rows.map((r) => toItem(r, profiles.get(r.seller_id), meId))
}

export async function fetchWanted(): Promise<Wanted[]> {
  const { data } = await db()
    .from('wanted_posts')
    .select('id, author_id, title, created_at')
    .order('created_at', { ascending: false })
  const rows = (data ?? []) as { id: string; author_id: string; title: string; created_at: string }[]
  const profiles = await profilesByIds(rows.map((r) => r.author_id))
  return rows.map((r) => ({
    id: numId(r.id),
    uuid: r.id,
    authorId: r.author_id,
    title: r.title,
    who: profiles.get(r.author_id)?.name ?? 'Someone',
    ago: ago(r.created_at),
    handoffs: profiles.get(r.author_id)?.handoffs ?? 0,
  }))
}

export async function createWanted(campusId: string, authorId: string, title: string): Promise<void> {
  const { error } = await db().from('wanted_posts').insert({ campus_id: campusId, author_id: authorId, title })
  if (error) throw error
}

// ── posting ───────────────────────────────────────────────────────────────────

/** Upload a listing photo. Returns null (rather than throwing) if Storage is not
 *  set up yet, so a missing bucket can never block someone from posting. */
export async function uploadPhoto(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await db().storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })
  if (error) {
    console.warn('[handoff] photo upload skipped:', error.message)
    return null
  }
  return path
}

export interface NewListing {
  campusId: string
  sellerId: string
  title: string
  kind: ListingKind
  free: boolean
  price: number
  tradeFor: string
  rentRate: number
  rentPeriod: string
  category: string
  condition: string
  spotName: string
  building: string
  description: string
  photoPath: string | null
}

export async function createListing(input: NewListing): Promise<void> {
  const priced = input.kind === 'sale'
  const { error } = await db().from('listings').insert({
    campus_id: input.campusId,
    seller_id: input.sellerId,
    title: input.title,
    description: input.description,
    kind: input.kind,
    is_free: input.kind === 'free',
    price: priced ? input.price : null,
    trade_for: input.kind === 'trade' ? input.tradeFor || null : null,
    rent_rate: input.kind === 'rent' ? input.rentRate : null,
    rent_period: input.kind === 'rent' ? input.rentPeriod : null,
    category: input.category,
    condition: input.condition,
    building: input.building || null,
    spot_name: input.spotName,
    photo_path: input.photoPath,
  })
  if (error) throw error
}

// ── claim → thread → chat ─────────────────────────────────────────────────────

/** Create the thread on claim, start the 3-hour hold, and post the opening
 *  message. Only the buyer's own message is inserted — RLS (correctly) forbids
 *  writing a message as the other person, so the seller's reply is real or not
 *  at all. */
export async function claimListing(args: {
  listingUuid: string | null
  campusId: string
  buyerId: string
  sellerId: string
  spotName: string
  pickupWindow: string
  openingMessage: string
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
  await sendMessage(threadId, args.buyerId, args.openingMessage)
  return threadId
}

interface ThreadRow {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  spot_name: string
  pickup_window: string
  created_at: string
  buyer_done: boolean
  seller_done: boolean
  completed_at: string | null
}

export async function fetchThreads(meId: string): Promise<ThreadSummary[]> {
  const { data } = await db()
    .from('threads')
    .select(
      'id, listing_id, buyer_id, seller_id, spot_name, pickup_window, created_at, buyer_done, seller_done, completed_at',
    )
    .order('created_at', { ascending: false })
  const rows = (data ?? []) as ThreadRow[]
  if (!rows.length) return []

  const others = rows.map((t) => (t.buyer_id === meId ? t.seller_id : t.buyer_id))
  const profiles = await profilesByIds(others)

  const listingIds = rows.map((t) => t.listing_id).filter((x): x is string => Boolean(x))
  const titles = new Map<string, string>()
  if (listingIds.length) {
    const { data: ls } = await db().from('listings').select('id, title').in('id', listingIds)
    for (const l of (ls ?? []) as { id: string; title: string }[]) titles.set(l.id, l.title)
  }

  const { data: msgs } = await db()
    .from('messages')
    .select('thread_id, body, created_at')
    .in('thread_id', rows.map((t) => t.id))
    .order('created_at', { ascending: false })
  const last = new Map<string, string>()
  for (const m of (msgs ?? []) as { thread_id: string; body: string }[]) {
    if (!last.has(m.thread_id)) last.set(m.thread_id, m.body)
  }

  return rows.map((t) => {
    const iAmBuyer = t.buyer_id === meId
    const otherId = iAmBuyer ? t.seller_id : t.buyer_id
    const p = profiles.get(otherId)
    return {
      id: t.id,
      otherName: p?.name ?? 'Someone on campus',
      otherHandoffs: p?.handoffs ?? 0,
      listingTitle: t.listing_id ? (titles.get(t.listing_id) ?? '') : '',
      spotName: t.spot_name,
      pickupWindow: t.pickup_window,
      lastMessage: last.get(t.id) ?? '',
      myDone: iAmBuyer ? t.buyer_done : t.seller_done,
      theirDone: iAmBuyer ? t.seller_done : t.buyer_done,
      completed: t.completed_at != null,
    }
  })
}

export async function fetchMessages(threadId: string, meId: string): Promise<Message[]> {
  const { data, error } = await db()
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((m) => {
    const row = m as { id: string; sender_id: string; body: string }
    return { id: numId(row.id), who: row.sender_id === meId ? 'me' : 'them', text: row.body }
  })
}

export async function sendMessage(threadId: string, senderId: string, body: string): Promise<void> {
  const text = body.trim()
  if (!text) return
  const { error } = await db().from('messages').insert({ thread_id: threadId, sender_id: senderId, body: text })
  if (error) throw error
}

/** Live-subscribe to new messages on a thread. */
export function subscribeMessages(threadId: string, onInsert: () => void): RealtimeChannel {
  return db()
    .channel(`messages:${threadId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
      () => onInsert(),
    )
    .subscribe()
}

/** Live-subscribe to one thread's own row — the other side's handoff
 *  confirmation arrives here. Harmless if `threads` is not in the realtime
 *  publication: the chat also re-reads the thread on every new message. */
export function subscribeThread(threadId: string, onChange: () => void): RealtimeChannel {
  return db()
    .channel(`thread:${threadId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'threads', filter: `id=eq.${threadId}` },
      () => onChange(),
    )
    .subscribe()
}

/** Live-subscribe to the campus board. */
export function subscribeListings(onChange: () => void): RealtimeChannel {
  return db()
    .channel('listings:board')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => onChange())
    .subscribe()
}

/**
 * Mark this side of a handoff done (or undo it while the other side has not
 * answered yet). The second confirmation is the one that counts: it closes the
 * listing, releases the hold and adds +1 to both handoff counts — which a
 * browser cannot do on its own, since nobody may write another person's
 * profile. `set_handoff_done` does it server-side after checking the caller is
 * one of the two participants.
 */
export interface HandoffState {
  buyerDone: boolean
  sellerDone: boolean
  completed: boolean
}

export async function setHandoffDone(threadId: string, done: boolean): Promise<HandoffState> {
  const { data, error } = await db().rpc('set_handoff_done', { p_thread: threadId, p_done: done })
  if (error) throw error
  const r = (data ?? {}) as Partial<HandoffState>
  return { buyerDone: r.buyerDone ?? false, sellerDone: r.sellerDone ?? false, completed: r.completed ?? false }
}

// ── lifecycle ─────────────────────────────────────────────────────────────────

export async function setListingStatus(uuid: string, status: ListingStatus): Promise<void> {
  const patch: Record<string, unknown> = { status }
  // Relisting re-dates the listing so the day-7 clock starts over.
  if (status === 'active') patch.confirmed_at = new Date().toISOString()
  const { error } = await db().from('listings').update(patch).eq('id', uuid)
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
  const { error } = await db()
    .from('listings')
    .update({ kind: 'free', is_free: true, price: null, rent_rate: null, rent_period: null, confirmed_at: new Date().toISOString() })
    .eq('id', uuid)
  if (error) throw error
}

// ── profile ───────────────────────────────────────────────────────────────────

export async function updateBuilding(userId: string, building: string): Promise<void> {
  const { error } = await db().from('profiles').update({ building: building.trim() || null }).eq('id', userId)
  if (error) throw error
}

export async function updateName(userId: string, name: string): Promise<void> {
  const clean = name.trim()
  if (!clean) return
  const { error } = await db().from('profiles').update({ name: clean }).eq('id', userId)
  if (error) throw error
}

// ── community rules ───────────────────────────────────────────────────────────

const rulesKey = (userId: string, version: number) => `handoff:rules:v${version}:${userId}`

/**
 * Whether this account has agreed to the current community rules.
 *
 * The agreement belongs in the database — it is a record, not a preference — but
 * the column arrives with migration 0004, so a project that has not run it yet
 * falls back to local storage instead of locking everyone out.
 */
export async function fetchRulesAccepted(userId: string, version: number): Promise<boolean> {
  try {
    const { data, error } = await db()
      .from('profiles')
      .select('rules_accepted_at, rules_version')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    const row = data as { rules_accepted_at: string | null; rules_version: number | null } | null
    if (row?.rules_accepted_at && (row.rules_version ?? 0) >= version) return true
    // Column exists and says no — but honour a local acceptance from before the
    // migration so nobody is asked twice.
    return localStorage.getItem(rulesKey(userId, version)) === 'yes'
  } catch {
    return localStorage.getItem(rulesKey(userId, version)) === 'yes'
  }
}

export async function acceptRules(userId: string, version: number): Promise<void> {
  localStorage.setItem(rulesKey(userId, version), 'yes')
  try {
    await db()
      .from('profiles')
      .update({ rules_accepted_at: new Date().toISOString(), rules_version: version })
      .eq('id', userId)
  } catch {
    /* pre-migration: the local record stands in until 0004 is applied */
  }
}
