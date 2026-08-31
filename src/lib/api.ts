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
  help_wanted: boolean | null
  help_fee: number | null
  category: string
  condition: string
  building: string | null
  spot_name: string
  status: ListingStatus
  photo_path: string | null
  photo_paths: string[] | null
  gone_by: string | null
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
    helpWanted: r.help_wanted ?? false,
    helpFee: r.help_fee ?? undefined,
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
    photoUrl: photoUrl(r.photo_paths?.[0] ?? r.photo_path),
    photoUrls: (r.photo_paths?.length ? r.photo_paths : [r.photo_path])
      .map(photoUrl)
      .filter((u): u is string => !!u),
    goneBy: r.gone_by ?? undefined,
    status: r.status,
    ageDays: daysSince(clock),
    mine: meId != null && r.seller_id === meId,
  }
}

// ── campus ────────────────────────────────────────────────────────────────────

export interface Campus {
  name: string
  logoUrl: string | null
  website: string | null
  isPlaceholder: boolean
}

/** The viewer's own campus. RLS scopes this to exactly one row. */
export async function fetchCampus(): Promise<Campus> {
  const { data } = await db()
    .from('campuses')
    .select('name, logo_url, website, is_placeholder')
    .limit(1)
    .maybeSingle()
  const row = data as
    | { name: string; logo_url: string | null; website: string | null; is_placeholder: boolean }
    | null
  return {
    name: row?.name ?? 'campus',
    logoUrl: row?.logo_url ?? null,
    website: row?.website ?? null,
    isPlaceholder: row?.is_placeholder ?? false,
  }
}

/**
 * Give a freshly created campus its real name.
 *
 * A board opens the moment someone signs in from a new school, and the trigger
 * can only name it after the domain ("Columbia" from columbia.edu). The proper
 * name lives in a registry that ships with the client, so the first person to
 * arrive finishes the job — and the database only accepts it while the name is
 * still a placeholder.
 */
export async function nameMyCampus(name: string): Promise<boolean> {
  const { data, error } = await db().rpc('name_my_campus', { p_name: name })
  if (error) return false
  return Boolean(data)
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
  'id, seller_id, title, description, kind, is_free, price, trade_for, rent_rate, rent_period, help_wanted, help_fee, category, condition, building, spot_name, status, photo_path, photo_paths, gone_by, created_at, confirmed_at'

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
export class PhotoUploadFailed extends Error {}

export async function uploadPhoto(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await db().storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })
  if (error) {
    // Never block the post — but never fail silently either. For two weeks
    // every listing arrived without its photo because the bucket did not
    // exist, and nothing anywhere said so.
    console.warn('[betterbarter] photo upload failed:', error.message)
    throw new PhotoUploadFailed(error.message)
  }
  return path
}

export interface NewListing {
  campusId: string
  sellerId: string
  lat: number | null
  lng: number | null
  title: string
  kind: ListingKind
  free: boolean
  price: number
  tradeFor: string
  rentRate: number
  rentPeriod: string
  helpWanted: boolean
  category: string
  condition: string
  spotName: string
  building: string
  description: string
  /** Up to MAX_PHOTOS, in the order they were taken. The first is the cover. */
  photoPaths: string[]
  /** "It has to be gone by Friday" — the whole reason a move-out board works. */
  goneBy: string | null
}

export async function createListing(input: NewListing): Promise<void> {
  const priced = input.kind === 'sale'
  const { error } = await db().from('listings').insert({
    campus_id: input.campusId,
    seller_id: input.sellerId,
    approx_lat: input.lat,
    approx_lng: input.lng,
    title: input.title,
    description: input.description,
    kind: input.kind,
    is_free: input.kind === 'free',
    price: priced ? input.price : null,
    trade_for: input.kind === 'trade' ? input.tradeFor || null : null,
    rent_rate: input.kind === 'rent' ? input.rentRate : null,
    rent_period: input.kind === 'rent' ? input.rentPeriod : null,
    help_wanted: input.helpWanted,
    category: input.category,
    condition: input.condition,
    building: input.building || null,
    spot_name: input.spotName,
    // photo_path stays as the cover so older clients keep working; photo_paths
    // is the real list.
    photo_path: input.photoPaths[0] ?? null,
    photo_paths: input.photoPaths,
    gone_by: input.goneBy,
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
      otherId,
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

// ── founders ──────────────────────────────────────────────────────────────────

export const REPORT_REASONS: [string, string][] = [
  ['not_as_described', 'Not as described'],
  ['never_showed', 'They never showed up'],
  ['rule_break', 'Broke the community rules'],
  ['harassment', 'Harassment or pressure'],
  ['unsafe', 'Felt unsafe'],
  ['spam', 'Spam or a scam'],
  ['other', 'Something else'],
]

/**
 * Report an account — which also blocks it, in one step.
 *
 * The rules promise both: the account disappears from your board immediately,
 * and it is flagged for review. The block is enforced by the listings policy,
 * so a blocked person's things stop appearing whatever the client does.
 */
export async function reportAccount(
  subjectId: string,
  reason: string,
  note: string,
  listingUuid?: string | null,
  threadId?: string | null,
): Promise<boolean> {
  const { data, error } = await db().rpc('report_account', {
    p_subject: subjectId,
    p_reason: reason,
    p_note: note || null,
    p_listing: listingUuid ?? null,
    p_thread: threadId ?? null,
  })
  if (error) return false
  return Boolean(data)
}

export interface ModerationRow {
  id: string
  reason: string
  note: string | null
  status: 'open' | 'reviewed' | 'actioned' | 'dismissed'
  created_at: string
  subject_name: string
  subject_email: string
  reporter_name: string
  campus: string
  times_reported: number
  subject_listings: number
}

export async function fetchModerationQueue(): Promise<ModerationRow[]> {
  const { data, error } = await db().rpc('moderation_queue')
  if (error || !data) return []
  return data as ModerationRow[]
}

export async function setReportStatus(id: string, status: string): Promise<boolean> {
  const { data, error } = await db().rpc('set_report_status', { p_report: id, p_status: status })
  if (error) return false
  return Boolean(data)
}

export interface FounderMetrics {
  accounts: number
  campuses: number
  listings: number
  listingsLive: number
  listingsGone: number
  threads: number
  handoffs: number
  carries: number
  carryOffers: number
  wanted: number
  messages: number
  ratingAvg: number | null
  ratingCount: number
  photos: number
  withLocation: number
  reportsOpen: number
  reportsTotal: number
  blocks: number
  listingsPaused: number
  listingsArchived: number
  deactivated: number
  dormant90: number
  photosQueued: number
  byKind: Record<string, number>
  byCategory: Record<string, number>
  byCampus: { name: string; accounts: number; listings: number; handoffs: number }[]
  daily: { day: string; signups: number; listings: number; handoffs: number }[]
}

/**
 * Aggregates across every campus, for the founders only.
 *
 * Every other read here is walled to one campus. This is the single deliberate
 * exception and it is narrow by construction: the database checks the flag, and
 * returns counts — never a name, a listing or a message.
 */
export async function fetchFounderMetrics(): Promise<FounderMetrics | null> {
  const { data, error } = await db().rpc('founder_metrics')
  if (error || !data) return null
  return data as FounderMetrics
}

// ── carrying ──────────────────────────────────────────────────────────────────

export interface CarryOffer {
  id: string
  listingId: string
  listingTitle: string
  helperId: string
  helperName: string
  helperCarries: number
  fee: number | null
  note: string
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn'
}

/** Offer to carry something. The fee is what you are asking, paid directly. */
export async function offerCarry(listingUuid: string, helperId: string, fee: number, note: string): Promise<void> {
  const { error } = await db().from('carry_offers').insert({
    listing_id: listingUuid,
    helper_id: helperId,
    fee: fee > 0 ? Math.round(fee) : null,
    note: note.trim() || null,
  })
  if (error) throw error
}

/** Offers the viewer can see: their own, plus any on their own listings. */
export async function fetchCarryOffers(): Promise<CarryOffer[]> {
  const { data } = await db()
    .from('carry_offers')
    .select('id, listing_id, helper_id, fee, note, status')
    .order('created_at', { ascending: false })
  const rows = (data ?? []) as {
    id: string
    listing_id: string
    helper_id: string
    fee: number | null
    note: string | null
    status: CarryOffer['status']
  }[]
  if (!rows.length) return []

  const profiles = await db()
    .from('profiles')
    .select('id, name, carries')
    .in('id', rows.map((r) => r.helper_id))
  const byId = new Map(
    ((profiles.data ?? []) as { id: string; name: string; carries: number }[]).map((p) => [p.id, p]),
  )

  const titles = new Map<string, string>()
  const { data: ls } = await db()
    .from('listings')
    .select('id, title')
    .in('id', rows.map((r) => r.listing_id))
  for (const l of (ls ?? []) as { id: string; title: string }[]) titles.set(l.id, l.title)

  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    listingTitle: titles.get(r.listing_id) ?? 'A listing',
    helperId: r.helper_id,
    helperName: byId.get(r.helper_id)?.name ?? 'Someone on campus',
    helperCarries: byId.get(r.helper_id)?.carries ?? 0,
    fee: r.fee,
    note: r.note ?? '',
    status: r.status,
  }))
}

/** The owner picks one. That person becomes the handoff's helper. */
export async function acceptCarry(offerId: string): Promise<boolean> {
  const { data, error } = await db().rpc('accept_carry', { p_offer: offerId })
  if (error) return false
  return Boolean(data)
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

/**
 * Where this person prefers to hand things over.
 *
 * This replaced the residence-hall field: a hall says where someone sleeps,
 * which is exactly what the product should never know or show, and it wrote
 * commuters out of their own campus. A preferred spot says where they are
 * happy to meet — public, on campus, and useful as the default in every claim.
 */
/**
 * Share an approximate location, or stop sharing one.
 *
 * The browser gives a precise fix; we round it to three decimal places
 * (~100 m) before it leaves the page, and the database rounds it again. It is
 * never returned to another user — the only thing anyone else can learn from it
 * is a distance in tenths of a kilometre, computed server-side.
 */
export async function setMyLocation(lat: number, lng: number): Promise<boolean> {
  const round = (n: number) => Math.round(n * 1000) / 1000
  const { data, error } = await db().rpc('set_my_location', { p_lat: round(lat), p_lng: round(lng) })
  if (error) return false
  return Boolean(data)
}

export async function clearMyLocation(): Promise<boolean> {
  const { data, error } = await db().rpc('clear_my_location')
  if (error) return false
  return Boolean(data)
}

/** listing id → distance in km, for listings the viewer can already see. */
export async function fetchDistances(): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  const { data, error } = await db().rpc('listing_distances')
  if (error || !data) return out
  for (const row of data as { listing_id: string; km: number }[]) out.set(row.listing_id, Number(row.km))
  return out
}

/** The profile fields the team asked for: pronouns, a short about, a picture. */
export async function updateProfileDetails(
  userId: string,
  fields: { pronouns?: string; about?: string; avatarPath?: string | null },
): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (fields.pronouns !== undefined) patch.pronouns = fields.pronouns.trim() || null
  if (fields.about !== undefined) patch.about = fields.about.trim().slice(0, 400) || null
  if (fields.avatarPath !== undefined) patch.avatar_path = fields.avatarPath
  if (!Object.keys(patch).length) return
  const { error } = await db().from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}

/** Rate the other person after a completed handoff. One per thread per rater —
 *  the database enforces both that and that you were actually in it. */
export async function rateHandoff(
  threadId: string,
  raterId: string,
  rateeId: string,
  stars: number,
  note: string,
): Promise<void> {
  const { error } = await db().from('ratings').insert({
    thread_id: threadId,
    rater_id: raterId,
    ratee_id: rateeId,
    stars: Math.max(1, Math.min(5, Math.round(stars))),
    note: note.trim() || null,
  })
  if (error) throw error
}

export interface RatingSummary {
  average: number | null
  total: number
}

export async function fetchRatingSummary(userId: string): Promise<RatingSummary> {
  const { data, error } = await db().rpc('rating_summary', { p_user: userId })
  if (error || !data) return { average: null, total: 0 }
  const row = (data as { average: number | null; total: number }[])[0]
  return { average: row?.average ?? null, total: Number(row?.total ?? 0) }
}

/** Whether this person has already rated this thread. */
export async function hasRated(threadId: string, raterId: string): Promise<boolean> {
  const { data } = await db()
    .from('ratings')
    .select('id')
    .eq('thread_id', threadId)
    .eq('rater_id', raterId)
    .maybeSingle()
  return Boolean(data)
}

export async function updatePreferredSpot(userId: string, spot: string): Promise<void> {
  const { error } = await db().from('profiles').update({ preferred_spot: spot.trim() || null }).eq('id', userId)
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


/* ── The lifecycle ───────────────────────────────────────────────────────────
 *
 * A listing that nobody has touched walks down a staircase — asked on day 7,
 * paused on day 9, off the shelf on day 30, photos released on day 90 — and the
 * owner can put it back at any step. The hourly job in the database does all of
 * it; these are the two places the app has to take part.
 */

/** Stamped on load so dormancy is measurable at all. Cheap, and rate-limited to
 *  once an hour inside the database, so calling it on every mount is fine. */
export async function touchLastSeen(): Promise<void> {
  const c = db()
  if (!c) return
  await c.rpc('touch_last_seen')
}

/** "Take me off the board." Not a delete — see the note in 0020. */
export async function deactivateAccount(): Promise<{ listingsHidden: number } | null> {
  const c = db()
  if (!c) return null
  const { data, error } = await c.rpc('deactivate_my_account')
  if (error) return null
  return data as { listingsHidden: number }
}

export async function reactivateAccount(): Promise<boolean> {
  const c = db()
  if (!c) return false
  const { error } = await c.rpc('reactivate_my_account')
  return !error
}

export interface ReclaimRow {
  id: string
  path: string
  queued_at: string
}

/** Photos with nothing left pointing at them. Postgres cannot reach into object
 *  storage, so the job queues the paths and a founder empties the queue. */
export async function fetchReclaimQueue(): Promise<ReclaimRow[]> {
  const c = db()
  if (!c) return []
  const { data, error } = await c
    .from('storage_reclaim')
    .select('id, path, queued_at')
    .is('deleted_at', null)
    .order('queued_at', { ascending: true })
    .limit(200)
  if (error || !data) return []
  return data as ReclaimRow[]
}

/** Deletes the files, then marks each one done. Anything that fails to delete
 *  stays queued rather than being marked — a queue that lies is worse than a
 *  queue that is long. */
export async function reclaimPhotos(rows: ReclaimRow[]): Promise<number> {
  const c = db()
  if (!c || !rows.length) return 0
  const { data, error } = await c.storage.from('listing-photos').remove(rows.map((r) => r.path))
  if (error) return 0
  const removed = new Set((data ?? []).map((o: { name: string }) => o.name))
  let done = 0
  for (const r of rows) {
    if (!removed.has(r.path)) continue
    const { data: ok } = await c.rpc('mark_photo_reclaimed', { p_path: r.path })
    if (ok) done += 1
  }
  return done
}

/* ── The handoff code ────────────────────────────────────────────────────────
 *
 * Six digits split down the middle: the buyer's app holds the first three, the
 * seller's the last three, and the database refuses to hand either of them the
 * other half — SELECT is revoked on the column, so this RPC is the only door.
 * Putting them back together is something you can only do standing next to
 * each other, which is the whole point: the handoff count is the carbon number,
 * and a number one person can raise alone is not evidence.
 */

export interface HandoffHalf {
  half: string
  position: 'first' | 'last'
  verified: boolean
  attempts: number
}

export async function fetchHandoffHalf(threadId: string): Promise<HandoffHalf | null> {
  const c = db()
  if (!c) return null
  const { data, error } = await c.rpc('my_handoff_half', { p_thread: threadId })
  if (error || !data) return null
  return data as HandoffHalf
}

export interface CodeResult {
  ok: boolean
  completed?: boolean
  alreadyDone?: boolean
  verified?: boolean
  lockedOut?: boolean
  attemptsLeft?: number
  why?: string
}

export async function confirmHandoffCode(threadId: string, code: string): Promise<CodeResult> {
  const c = db()
  if (!c) return { ok: false, why: 'Not connected.' }
  const { data, error } = await c.rpc('confirm_handoff_code', { p_thread: threadId, p_code: code })
  if (error) return { ok: false, why: error.message }
  return data as CodeResult
}


export interface HandoffIntegrity {
  handoffs: number
  verified: number
  onTrust: number
  openCodes: number
  badTries: number
  lockedOut: number
}

/** Verified in person versus taken on trust — the split behind the carbon number. */
export async function fetchHandoffIntegrity(): Promise<HandoffIntegrity | null> {
  const c = db()
  if (!c) return null
  const { data, error } = await c.rpc('handoff_integrity')
  if (error || !data) return null
  return data as HandoffIntegrity
}

/* ── What a stranger may know ────────────────────────────────────────────────
 *
 * The only thing an anonymous visitor can ask this database. Counts and a
 * campus name; never a row, never a person. It exists so a shared link can say
 * what is waiting instead of showing a bare sign-in wall — during move-in week
 * that difference is the whole invitation.
 */
export interface Teaser {
  scope: 'all' | 'campus'
  campus: string | null
  live: number
  free: number
  campuses: number
}

export async function fetchTeaser(domain?: string | null): Promise<Teaser | null> {
  const c = db()
  if (!c) return null
  const { data, error } = await c.rpc('campus_teaser', { p_domain: domain ?? null })
  if (error || !data) return null
  return data as Teaser
}
