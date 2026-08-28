import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AGE_DAYS, AUTO_PAUSED, CAMPUS_SPOTS, ITEMS, ME, SPOTS, WANTED } from '../data/seed'
import type {
  CampusSpot,
  EditField,
  Item,
  ListingStatus,
  MeProfile,
  Message,
  Screen,
  Tab,
  ThreadSummary,
  Wanted,
} from '../data/types'
import * as api from './api'
import { parseListing } from './parse'
import { CATEGORIES, CONDITIONS, KINDS_ENABLED, MAX_PHOTOS, toCategory, toCondition } from './taxonomy'
import { contactWarning, findContactInfo } from './contact'
import { checkListing, RULES_VERSION, type RuleHit } from './rules'

export interface BarterConfig {
  moveOutBanner: boolean
  defaultTab: Tab
}

/** Everything the live app needs about the signed-in user. When this is absent
 *  the hook runs the seed-data demo (used by `?showcase`). */
export interface LiveContext {
  userId: string
  campusId: string
  name: string
  email: string
  building: string | null
  preferredSpot: string | null
  pronouns: string | null
  about: string | null
  lat: number | null
  lng: number | null
  handoffs: number
  carries: number
  noShows: number
  joinedAt: string | null
  refreshProfile: () => void
  signOut: () => Promise<void>
}

const EMPTY_ITEM: Item = {
  id: -1,
  kind: 'free',
  free: true,
  title: '',
  cat: '',
  cond: '',
  loc: '',
  ago: '',
  seller: '',
  handoffs: 0,
  since: '',
  spot: '',
  desc: '',
}

export function useBarter(config: BarterConfig, live?: LiveContext) {
  const isLive = Boolean(live)

  // The profile arrives after the first render, so this initial value is very
  // often 'gate' for someone who is in fact signed in. The effect below is what
  // actually decides — without it a signed-in person lands on a sign-in screen
  // they have no business seeing, with the navigation rail beside it.
  const [screen, setScreen] = useState<Screen>(isLive ? 'browse' : 'gate')
  const [tab, setTab] = useState<Tab | null>(null)
  const [q, setQ] = useState('')
  const [selId, setSelId] = useState(isLive ? -1 : 2)

  // demo-only lifecycle sets
  const [confirmed, setConfirmed] = useState<number[]>([])
  const [freed, setFreed] = useState<number[]>([])
  const [relisted, setRelisted] = useState<number[]>([])
  const [goneDemo, setGoneDemo] = useState<number[]>([])
  const [extra, setExtra] = useState<Item[]>([])

  // live data
  const [items, setItems] = useState<Item[]>([])
  const [wanted, setWanted] = useState<Wanted[]>(isLive ? [] : WANTED)
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [spots, setSpots] = useState<CampusSpot[]>(isLive ? [] : CAMPUS_SPOTS)
  // Distance is a band, not a position: the database returns tenths of a
  // kilometre per listing and never a coordinate.
  const [distances, setDistances] = useState<Map<string, number>>(new Map())
  const [radiusKm, setRadiusKm] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)

  // How the campus rated this person, in aggregate. Individual notes stay
  // between the two people who exchanged them.
  const [rating, setRating] = useState<{ average: number | null; total: number }>({ average: null, total: 0 })

  // Carrying: offers this person made, and offers made on their listings.
  const [carryOffers, setCarryOffers] = useState<api.CarryOffer[]>([])

  const [campusName, setCampusName] = useState(isLive ? '' : 'Columbia University')
  const [campusLogo, setCampusLogo] = useState<string | null>(
    isLive ? null : 'https://www.google.com/s2/favicons?domain=columbia.edu&sz=128',
  )
  const [loadingBoard, setLoadingBoard] = useState(isLive)
  const [error, setError] = useState<string | null>(null)

  const [spot, setSpot] = useState(SPOTS[0].name)
  const [spotName, setSpotName] = useState(live?.preferredSpot ?? '')
  const [win, setWin] = useState('Today 6–8pm')

  const [msgs, setMsgs] = useState<Message[]>([])
  const [draftMsg, setDraftMsg] = useState('')
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  // Demo-mode stand-in for the two confirmations (live mode reads the thread).
  const [demoBetterBarter, setDemoHandoff] = useState({ myDone: false, theirDone: false, completed: false })
  const [confirming, setConfirming] = useState(false)

  /**
   * The listing form.
   *
   * The paragraph still does the first pass — nobody should have to fill in
   * eight fields to give away a lamp — but what gets posted is now the fields,
   * because a board is only searchable if two people describing the same object
   * land in the same category. Anything the person edits themselves is
   * remembered as `touched` and never overwritten by a later parse.
   */
  const [form, setForm] = useState({
    brand: '',
    item: '',
    category: 'Others' as (typeof CATEGORIES)[number],
    condition: 'Lightly Used' as (typeof CONDITIONS)[number],
    dimensions: '',
    description: '',
    kind: 'free' as Item['kind'],
    price: 10,
    tradeFor: '',
    rentRate: 5,
    rentPeriod: 'week',
    spot: '',
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const setField = useCallback(<K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setTouched((prev) => ({ ...prev, [key]: true }))
  }, [])

  const [photo, setPhoto] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [postText, setPostText] = useState('')
  const [edit, setEdit] = useState<EditField | null>(null)
  const [oTitle, setOTitle] = useState<string | null>(null)
  const [oPrice, setOPrice] = useState<number | null>(null)
  const [oFree, setOFree] = useState<boolean | null>(null)
  const [oSpot, setOSpot] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [wantedDraft, setWantedDraft] = useState('')
  // "This needs two people" — set on the post screen, and the one thing that
  // turns a listing into a job for someone with an hour to spare.
  const [needsHelp, setNeedsHelp] = useState(false)

  // community rules: agreed once per account, checked again before each post
  const [rulesAccepted, setRulesAccepted] = useState(!isLive)
  const [rulesLoading, setRulesLoading] = useState(isLive)
  const [ruleHits, setRuleHits] = useState<RuleHit[]>([])
  const [ruleOverride, setRuleOverride] = useState(false)

  const [postedTitle, setPostedTitle] = useState('')
  const [postedNote, setPostedNote] = useState('')

  const [moveOut, setMoveOut] = useState<boolean | null>(null)
  const [alerts, setAlerts] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const replyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    return () => {
      clearTimeout(toastTimer.current)
      clearTimeout(replyTimer.current)
    }
  }, [])

  // Session resolved: leave the gate for the board, and never strand someone on
  // it again. Anything else the person has navigated to is left alone.
  useEffect(() => {
    if (!isLive) return
    setScreen((prev) => (prev === 'gate' ? 'browse' : prev))
  }, [isLive])

  const flash = useCallback((text: string) => {
    clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const fail = useCallback(
    (e: unknown, fallback: string) => {
      const msg = e instanceof Error ? e.message : fallback
      setError(msg)
      flash(msg)
    },
    [flash],
  )

  const go = useCallback((next: Screen) => {
    setScreen(next)
    setToast(null)
  }, [])

  // ── loading live data ──────────────────────────────────────────────────────
  const userId = live?.userId ?? null

  const refreshBoard = useCallback(async () => {
    if (!isLive) return
    try {
      const next = await api.fetchListings(userId)
      setItems(next)
      setError(null)
      if (live?.lat != null) api.fetchDistances().then(setDistances).catch(() => {})
    } catch (e) {
      fail(e, 'Could not load the board.')
    } finally {
      setLoadingBoard(false)
    }
  }, [isLive, userId, live?.lat, fail])

  const refreshThreads = useCallback(async () => {
    if (!isLive || !userId) return
    try {
      setThreads(await api.fetchThreads(userId))
    } catch {
      /* threads are non-critical for the board */
    }
  }, [isLive, userId])

  const refreshWanted = useCallback(async () => {
    if (!isLive) return
    try {
      setWanted(await api.fetchWanted())
    } catch {
      /* non-critical */
    }
  }, [isLive])

  useEffect(() => {
    if (!isLive || !userId) return
    let cancelled = false
    api
      .fetchRulesAccepted(userId, RULES_VERSION)
      .then((ok) => {
        if (!cancelled) setRulesAccepted(ok)
      })
      .finally(() => {
        if (!cancelled) setRulesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isLive, userId])

  useEffect(() => {
    if (!isLive) return
    void refreshBoard()
    void refreshThreads()
    void refreshWanted()
    api.fetchSpots().then(setSpots).catch(() => {})
    if (userId) api.fetchRatingSummary(userId).then(setRating).catch(() => {})
    if (userId) api.fetchCarryOffers().then(setCarryOffers).catch(() => {})
    void (async () => {
      try {
        const campus = await api.fetchCampus()
        setCampusName(campus.name)
        setCampusLogo(campus.logoUrl)

        // A board that opened minutes ago only knows its domain. The registry is
        // 340KB, so it loads only in the one case that needs it, once.
        if (campus.isPlaceholder && live?.email) {
          const domain = live.email.split('@')[1]?.toLowerCase()
          if (!domain) return
          const registry = (await import('../data/campuses.json')).default as Record<string, string>
          const proper = registry[domain]
          if (proper && (await api.nameMyCampus(proper))) setCampusName(proper)
        }
      } catch {
        /* the board works without a campus name */
      }
    })()
  }, [isLive, refreshBoard, refreshThreads, refreshWanted])

  // Board stays live while the app is open.
  useEffect(() => {
    if (!isLive) return
    const ch = api.subscribeListings(() => void refreshBoard())
    return () => {
      void ch.unsubscribe()
    }
  }, [isLive, refreshBoard])

  // ── derived helpers ────────────────────────────────────────────────────────
  const all = useCallback((): Item[] => (isLive ? items : extra.concat(ITEMS)), [isLive, items, extra])

  const effectiveTab: Tab = tab ?? config.defaultTab
  const effectiveMoveOut = moveOut === null ? config.moveOutBanner : moveOut

  const spotLabel = useCallback(
    () => spotName.trim() || spot.replace(/^A /, '').replace(/^a /, ''),
    [spot, spotName],
  )

  const item = useCallback(
    (id: number): Item => all().find((x) => x.id === id) ?? (isLive ? EMPTY_ITEM : ITEMS[1]),
    [all, isLive],
  )

  const isFree = useCallback(
    (it: Item) => (isLive ? it.free : it.free || freed.includes(it.id)),
    [isLive, freed],
  )
  /** How a listing prices itself on a card: FREE, $40, $5/WEEK, SWAP. */
  const priceOf = useCallback(
    (it: Item) => {
      if (it.kind === 'rent') return '$' + (it.rentRate ?? 0) + '/' + (it.rentPeriod ?? 'week')
      if (it.kind === 'trade') return 'SWAP'
      return isFree(it) ? 'FREE' : '$' + it.price
    },
    [isFree],
  )

  /** Which board tab a listing belongs on. `freed` is the demo's day-7 "make it
   *  free" action, which moves a sale onto the free tab. */
  const kindOf = useCallback(
    (it: Item): Item['kind'] => (isFree(it) && it.kind === 'sale' ? 'free' : it.kind),
    [isFree],
  )
  const daysOf = useCallback(
    (it: Item) => (isLive ? (it.ageDays ?? 0) : AGE_DAYS[it.id] || 0),
    [isLive],
  )
  const isPaused = useCallback(
    (it: Item) =>
      isLive ? it.status === 'paused' : AUTO_PAUSED.includes(it.id) && !relisted.includes(it.id),
    [isLive, relisted],
  )
  const isStale = useCallback(
    (it: Item) =>
      isLive
        ? Boolean(it.mine) && it.status === 'active' && daysOf(it) >= 7
        : daysOf(it) >= 7 && !confirmed.includes(it.id) && !isPaused(it),
    [isLive, confirmed, daysOf, isPaused],
  )

  const gone = useMemo(
    () => (isLive ? items.filter((i) => i.status === 'gone').map((i) => i.id) : goneDemo),
    [isLive, items, goneDemo],
  )

  const myListings = useMemo(
    () => (isLive ? items.filter((i) => i.mine) : extra.concat([ITEMS[1], ITEMS[7]])),
    [isLive, items, extra],
  )
  const staleListings = useMemo(
    () => (isLive ? myListings.filter(isStale) : [ITEMS[6], ITEMS[7]].filter(isStale)),
    [isLive, myListings, isStale],
  )
  const pausedListings = useMemo(
    () => (isLive ? myListings.filter((i) => i.status === 'paused') : [ITEMS[7]].filter(isPaused)),
    [isLive, myListings, isPaused],
  )

  const me: MeProfile = useMemo(() => {
    if (!live) return ME
    return {
      name: live.name,
      initials: api.initialsOf(live.name),
      email: live.email,
      since: live.joinedAt
        ? new Date(live.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '',
      handoffs: live.handoffs,
      carries: live.carries,
      noShows: live.noShows,
      building: live.building ?? '',
      preferredSpot: live.preferredSpot ?? '',
      pronouns: live.pronouns ?? '',
      about: live.about ?? '',
      rating: rating.average,
      ratings: rating.total,
    }
  }, [live, rating])

  const liveCount = isLive
    ? items.filter((i) => i.status === 'active').length
    : 142 + extra.length - goneDemo.length

  const parse = useMemo(
    () => parseListing(postText, { oTitle, oPrice, oFree, oSpot, spotName }),
    [postText, oTitle, oPrice, oFree, oSpot, spotName],
  )

  // Every keystroke in the paragraph refills the fields the person has not
  // edited. Fields they have edited are theirs.
  useEffect(() => {
    if (!postText.trim()) return
    setForm((prev) => ({
      ...prev,
      item: touched.item ? prev.item : parse.title,
      category: touched.category ? prev.category : toCategory(parse.cat),
      condition: touched.condition ? prev.condition : toCondition(parse.cond),
      kind: touched.kind ? prev.kind : KINDS_ENABLED[parse.kind] ? parse.kind : 'sale',
      price: touched.price ? prev.price : parse.price,
      tradeFor: touched.tradeFor ? prev.tradeFor : parse.tradeFor,
      rentRate: touched.rentRate ? prev.rentRate : parse.rentRate,
      rentPeriod: touched.rentPeriod ? prev.rentPeriod : parse.rentPeriod,
      spot: touched.spot ? prev.spot : prev.spot || parse.spot,
      description: touched.description ? prev.description : prev.description,
    }))
  }, [postText, parse, touched])

  const resetOverrides = useCallback(() => {
    setOTitle(null)
    setOPrice(null)
    setOFree(null)
    setOSpot(null)
  }, [])

  // ── chat ───────────────────────────────────────────────────────────────────
  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  )

  const loadMessages = useCallback(
    async (threadId: string) => {
      if (!userId) return
      try {
        setMsgs(await api.fetchMessages(threadId, userId))
      } catch (e) {
        fail(e, 'Could not load the conversation.')
      }
    },
    [userId, fail],
  )

  useEffect(() => {
    if (!isLive || !activeThreadId) return
    const msgCh = api.subscribeMessages(activeThreadId, () => {
      void loadMessages(activeThreadId)
      void refreshThreads()
    })
    // The other side tapping "handed off" changes the thread row, not a message.
    const threadCh = api.subscribeThread(activeThreadId, () => void refreshThreads())
    return () => {
      void msgCh.unsubscribe()
      void threadCh.unsubscribe()
    }
  }, [isLive, activeThreadId, loadMessages, refreshThreads])

  const openThread = useCallback(
    (threadId: string) => {
      setActiveThreadId(threadId)
      setScreen('chat')
      setToast(null)
      void loadMessages(threadId)
      void refreshThreads()
    },
    [loadMessages, refreshThreads],
  )

  // ── the handoff confirmation loop ──────────────────────────────────────────
  /** What the chat shows: my tap, their tap, and whether it has been counted. */
  const handoffState = useMemo(() => {
    if (!isLive) return demoBetterBarter
    return {
      myDone: activeThread?.myDone ?? false,
      theirDone: activeThread?.theirDone ?? false,
      completed: activeThread?.completed ?? false,
    }
  }, [isLive, demoBetterBarter, activeThread])

  /**
   * Tap "handed off" (or undo it, while the other side has not answered). The
   * second confirmation is the one with consequences: the listing closes, the
   * hold is released and both handoff counts go up — which is why it happens in
   * one server-side function rather than in the browser.
   */
  const markHandedOff = useCallback(
    (done = true) => {
      const first = (activeThread?.otherName ?? item(selId).seller ?? 'they').split(' ')[0]

      if (!isLive) {
        if (!done) {
          setDemoHandoff({ myDone: false, theirDone: false, completed: false })
          return
        }
        setDemoHandoff((prev) => ({ ...prev, myDone: true }))
        flash('Marked. It counts once ' + first + ' confirms too.')
        clearTimeout(replyTimer.current)
        replyTimer.current = setTimeout(() => {
          setDemoHandoff({ myDone: true, theirDone: true, completed: true })
          setMsgs((prev) => prev.concat([{ id: Date.now(), who: 'them', text: 'Handed off. +1 for both of us.' }]))
          flash('Handed off. +1 for both of you.')
        }, 1400)
        return
      }

      if (!activeThreadId || confirming) return
      setConfirming(true)
      void (async () => {
        try {
          const res = await api.setHandoffDone(activeThreadId, done)
          await refreshThreads()
          if (res.completed) {
            await loadMessages(activeThreadId)
            void refreshBoard()
            live?.refreshProfile()
            flash('Handed off. +1 for both of you.')
          } else if (done) {
            flash('Marked. It counts once ' + first + ' confirms too.')
          }
        } catch (e) {
          fail(e, 'Could not confirm that handoff.')
        } finally {
          setConfirming(false)
        }
      })()
    },
    [
      isLive,
      activeThread,
      activeThreadId,
      confirming,
      item,
      selId,
      flash,
      fail,
      refreshThreads,
      refreshBoard,
      loadMessages,
      live,
    ],
  )

  const sendText = useCallback(
    (text: string) => {
      if (!text.trim()) return

      // Personal contact details are not discouraged here, they are refused.
      // The thread is the only record either person has if a handoff goes
      // wrong, and it stops being one the moment it moves to a phone number.
      const contact = findContactInfo(text)
      if (contact.length) {
        flash(contactWarning(contact))
        return
      }
      if (isLive) {
        if (!activeThreadId || !userId) return
        const body = text.trim()
        setDraftMsg('')
        api
          .sendMessage(activeThreadId, userId, body)
          .then(() => loadMessages(activeThreadId))
          .then(() => refreshThreads())
          .catch((e) => fail(e, 'Message did not send.'))
        return
      }
      const mine: Message = { id: Date.now(), who: 'me', text: text.trim() }
      setMsgs((prev) => prev.concat([mine]))
      setDraftMsg('')
      clearTimeout(replyTimer.current)
      replyTimer.current = setTimeout(() => {
        setMsgs((prev) =>
          prev.concat([
            {
              id: Date.now() + 1,
              who: 'them',
              text: 'Works for me. I will be at ' + spotLabel() + ' — I am in a red hoodie.',
            },
          ]),
        )
      }, 1100)
    },
    [isLive, activeThreadId, userId, loadMessages, refreshThreads, fail, flash, spotLabel],
  )

  // ── navigation ─────────────────────────────────────────────────────────────
  const signIn = useCallback(() => go('browse'), [go])
  const jumpBrowse = useCallback(() => go('browse'), [go])
  const jumpChats = useCallback(() => {
    void refreshThreads()
    go('chats')
  }, [go, refreshThreads])
  const jumpMe = useCallback(() => go('me'), [go])
  const openDetail = useCallback((id: number) => {
    setSelId(id)
    setScreen('detail')
    setToast(null)
  }, [])
  const jumpWanted = useCallback(() => {
    setScreen('browse')
    setTab('wanted')
    setToast(null)
  }, [])
  const back = useCallback(() => go(screen === 'claim' ? 'detail' : 'browse'), [go, screen])

  const jumpClaim = useCallback(() => {
    setSelId(2)
    setScreen('claim')
    setToast(null)
  }, [])

  /** Demo-only shortcut used by the showcase notes column. */
  const jumpChat = useCallback(() => {
    if (isLive) {
      if (threads.length) openThread(threads[0].id)
      else go('chats')
      return
    }
    setScreen('chat')
    setToast(null)
    setMsgs((prev) =>
      prev.length
        ? prev
        : [
            { id: 1, who: 'me', text: 'Claimed the desk lamp. Does 6pm still work?' },
            {
              id: 2,
              who: 'them',
              text: 'Yes — I will leave it at the desk with your name on it if I am in class.',
            },
          ],
    )
  }, [isLive, threads, openThread, go])

  // ── posting ────────────────────────────────────────────────────────────────
  const startPost = useCallback(() => {
    setScreen('post1')
    setPhoto(false)
    setPhotoFile(null)
    setPhotoPreview(null)
    setPostText('')
    setEdit(null)
    resetOverrides()
    setRuleHits([])
    setRuleOverride(false)
    setNeedsHelp(false)
    setTouched({})
    setForm((prev) => ({
      ...prev,
      brand: '',
      item: '',
      dimensions: '',
      description: '',
      spot: live?.preferredSpot ?? prev.spot,
    }))
    setToast(null)
  }, [resetOverrides, live])

  /** Real camera/library pick. Demo mode still fakes it with one tap. */
  const pickPhoto = useCallback(
    (file: File | null) => {
      if (!file) return
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
      setPhoto(true)
      flash('Got it. Now just say what it is in your own words.')
    },
    [flash],
  )

  const shoot = useCallback(() => {
    setPhoto(true)
    flash('Got it. Now just say what it is in your own words.')
  }, [flash])

  const toStep2 = useCallback(() => {
    if (photo) go('post2')
  }, [photo, go])

  const toStep1 = useCallback(() => go('post1'), [go])

  const useExample = useCallback(() => {
    setPostText(
      'giving away my ikea desk lamp, barely used, bulb still in it. leaving friday so grab it tonight at the front desk',
    )
    resetOverrides()
  }, [resetOverrides])

  const onEditValue = useCallback(
    (v: string) => {
      if (edit === 'title') setOTitle(v)
      else if (edit === 'spot') setOSpot(v)
      else if (/free/i.test(v)) {
        setOFree(true)
        setOPrice(0)
      } else {
        setOFree(false)
        setOPrice(parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)
      }
    },
    [edit],
  )

  const publish = useCallback(() => {
    // What gets posted is the form. The paragraph was how it got filled in.
    const title = [form.brand.trim(), form.item.trim()].filter(Boolean).join(' - ') || 'Untitled thing'
    const p = {
      ...parse,
      title,
      kind: form.kind,
      price: form.price,
      tradeFor: form.tradeFor,
      rentRate: form.rentRate,
      rentPeriod: form.rentPeriod,
      cat: form.category,
      cond: form.condition,
      spot: form.spot || parse.spot,
      free: form.kind === 'free',
    }

    // Nothing dangerous or illegal goes on the board. Blocked matches cannot be
    // overridden; ambiguous ones can, once the person has read why.
    const hits = checkListing(postText)
    const blocked = hits.some((x) => x.level === 'blocked')
    if (hits.length && (blocked || !ruleOverride)) {
      setRuleHits(hits)
      return
    }
    setRuleHits([])
    const note =
      p.kind === 'rent'
        ? 'Listed to lend at $' + p.rentRate + ' a ' + p.rentPeriod + '. It comes back to you.'
        : p.kind === 'trade'
          ? 'Listed as a swap' + (p.tradeFor ? ' for ' + p.tradeFor : '') + '. It is on the board now.'
          : p.kind === 'sale'
            ? 'Listed at $' + p.price + '. It is on the board now.'
            : 'It is on the board now. Anyone on campus with a matching saved search gets pinged.'

    if (!isLive || !live) {
      const it: Item = {
        id: 900 + extra.length,
        kind: p.kind,
        free: p.free,
        price: p.price,
        tradeFor: p.tradeFor,
        rentRate: p.rentRate,
        rentPeriod: p.rentPeriod,
        helpWanted: needsHelp,
        title: p.title,
        cat: p.cat,
        cond: p.cond,
        loc: 'Carman 6',
        ago: 'just now',
        seller: ME.name,
        handoffs: ME.handoffs,
        since: ME.since,
        spot: p.spot,
        desc: postText.trim() || 'Posted during move-out week.',
      }
      setExtra((prev) => [it].concat(prev))
      setSpotName(p.spot)
      setWin(p.when)
      setPostedTitle(p.title.toUpperCase())
      setPostedNote(note)
      setScreen('posted')
      setToast(null)
      return
    }

    setBusy(true)
    void (async () => {
      try {
        let path: string | null = null
        let photoFailed = false
        if (photoFile) {
          try {
            path = await api.uploadPhoto(photoFile, live.userId)
          } catch {
            photoFailed = true
          }
        }
        await api.createListing({
          campusId: live.campusId,
          sellerId: live.userId,
          lat: live.lat,
          lng: live.lng,
          title: p.title,
          kind: p.kind,
          free: p.free,
          price: p.price,
          tradeFor: p.tradeFor,
          rentRate: p.rentRate,
          rentPeriod: p.rentPeriod,
          helpWanted: needsHelp,
          category: p.cat,
          condition: p.cond,
          spotName: p.spot,
          building: live.building ?? '',
          description: [form.description.trim(), form.dimensions.trim() && `Size: ${form.dimensions.trim()}`]
            .filter(Boolean)
            .join('\n\n') || postText.trim(),
          photoPath: path,
        })
        await api.bumpSpot(live.campusId, p.spot)
        await refreshBoard()
        api.fetchSpots().then(setSpots).catch(() => {})
        setSpotName(p.spot)
        setWin(p.when)
        setPostedTitle(p.title.toUpperCase())
        setPostedNote(
          photoFailed
            ? note + ' The photo did not upload — open the listing and try adding it again.'
            : note,
        )
        setScreen('posted')
        if (photoFailed) flash('Posted, but the photo did not upload.')
        else setToast(null)
      } catch (e) {
        fail(e, 'Could not post that. Try again.')
      } finally {
        setBusy(false)
      }
    })()
  }, [parse, form, needsHelp, isLive, live, extra.length, postText, photoFile, ruleOverride, refreshBoard, fail])

  // ── claim ──────────────────────────────────────────────────────────────────
  const confirmClaim = useCallback(() => {
    const d0 = item(selId)
    const first = (d0.seller || 'them').split(' ')[0]

    if (!isLive || !live) {
      setDemoHandoff({ myDone: false, theirDone: false, completed: false })
      setMsgs([
        { id: 1, who: 'me', text: 'Claimed the ' + d0.title.toLowerCase() + '. Does the window still work for you?' },
        { id: 2, who: 'them', text: 'Yes — I will bring it down. It is heavier than it looks, fair warning.' },
      ])
      setScreen('chat')
      flash('Held for 3 hours. ' + first + ' has been messaged.')
      return
    }

    // Capture before the async closure so the narrowing survives.
    const listingUuid = d0.uuid
    const sellerId = d0.sellerId
    if (!listingUuid || !sellerId) return
    setBusy(true)
    void (async () => {
      try {
        const what = d0.title.toLowerCase()
        const opening =
          d0.kind === 'rent'
            ? `Could I borrow the ${what} at ${d0.rentRate ?? 0} a ${d0.rentPeriod ?? 'week'}? I can pick it up ${win} at ${spotLabel()}.`
            : d0.kind === 'trade'
              ? `Would you swap the ${what}${d0.tradeFor ? ` — you are after ${d0.tradeFor}?` : '?'} I can meet ${win} at ${spotLabel()}.`
              : isFree(d0)
                ? `Claimed the ${what}. Does ${win} at ${spotLabel()} work?`
                : `Is the ${what} still available? I can do ${win} at ${spotLabel()}.`
        const threadId = await api.claimListing({
          listingUuid,
          campusId: live.campusId,
          buyerId: live.userId,
          sellerId,
          spotName: spotLabel(),
          pickupWindow: win,
          openingMessage: opening,
        })
        await api.bumpSpot(live.campusId, spotLabel())
        await refreshThreads()
        setActiveThreadId(threadId)
        await loadMessages(threadId)
        setScreen('chat')
        flash('Held for 3 hours. ' + first + ' has been messaged.')
      } catch (e) {
        fail(e, 'Could not claim that. Try again.')
      } finally {
        setBusy(false)
      }
    })()
  }, [item, selId, isLive, live, isFree, win, spotLabel, refreshThreads, loadMessages, flash, fail])

  // ── lifecycle ──────────────────────────────────────────────────────────────
  const liveMutate = useCallback(
    async (id: number, fn: (uuid: string) => Promise<void>, done: string) => {
      const it = all().find((x) => x.id === id)
      if (!it?.uuid) return
      try {
        await fn(it.uuid)
        await refreshBoard()
        flash(done)
      } catch (e) {
        fail(e, 'That did not save.')
      }
    },
    [all, refreshBoard, flash, fail],
  )

  const confirmStill = useCallback(
    (id: number) => {
      if (isLive) {
        void liveMutate(id, api.confirmStillHere, 'Confirmed. Back to the top of its category, next check in 7 days.')
        return
      }
      setConfirmed((prev) => prev.concat([id]))
      flash('Confirmed. Back to the top of its category, next check in 7 days.')
    },
    [isLive, liveMutate, flash],
  )

  const markGoneStale = useCallback(
    (id: number) => {
      if (isLive) {
        void liveMutate(id, (u) => api.setListingStatus(u, 'gone'), 'Cleared off the board.')
        return
      }
      setGoneDemo((prev) => prev.concat([id]))
      setConfirmed((prev) => prev.concat([id]))
      flash('Cleared off the board.')
    },
    [isLive, liveMutate, flash],
  )

  const makeFree = useCallback(
    (id: number) => {
      if (isLive) {
        void liveMutate(id, api.makeListingFree, 'Now free. Everyone with a matching saved search was pinged.')
        return
      }
      setFreed((prev) => prev.concat([id]))
      setConfirmed((prev) => prev.concat([id]))
      flash('Now free. Everyone with a matching saved search was pinged.')
    },
    [isLive, liveMutate, flash],
  )

  const relist = useCallback(
    (id: number) => {
      if (isLive) {
        void liveMutate(id, (u) => api.setListingStatus(u, 'active'), 'Relisted, dated today.')
        return
      }
      setRelisted((prev) => prev.concat([id]))
      setConfirmed((prev) => prev.concat([id]))
      flash('Relisted, dated today.')
    },
    [isLive, liveMutate, flash],
  )

  const toggleGone = useCallback(
    (id: number, isGone: boolean) => {
      if (isLive) {
        const next: ListingStatus = isGone ? 'active' : 'gone'
        void liveMutate(
          id,
          (u) => api.setListingStatus(u, next),
          isGone ? 'Back on the board.' : 'Marked gone. It disappears from the board immediately.',
        )
        return
      }
      setGoneDemo((prev) => (isGone ? prev.filter((g) => g !== id) : prev.concat([id])))
      flash(isGone ? 'Back on the board.' : 'Marked gone. It disappears from the board immediately.')
    },
    [isLive, liveMutate, flash],
  )

  // ── wanted ─────────────────────────────────────────────────────────────────
  const offerWanted = useCallback(
    (w: Wanted) => {
      if (!isLive || !live) {
        setMsgs([
          {
            id: 1,
            who: 'me',
            text: 'I have one — ' + w.title.split('—')[0].trim().toLowerCase() + '. Free if you can grab it tonight.',
          },
        ])
        setScreen('chat')
        flash('Reply sent to ' + w.who + '.')
        return
      }
      const authorId = w.authorId
      if (!authorId) return
      void (async () => {
        try {
          const threadId = await api.claimListing({
            listingUuid: null,
            campusId: live.campusId,
            buyerId: live.userId,
            sellerId: authorId,
            spotName: spotLabel(),
            pickupWindow: win,
            openingMessage:
              'I have one — ' + w.title.split('—')[0].trim().toLowerCase() + '. Still looking?',
          })
          await refreshThreads()
          setActiveThreadId(threadId)
          await loadMessages(threadId)
          setScreen('chat')
          flash('Reply sent to ' + w.who + '.')
        } catch (e) {
          fail(e, 'Could not send that reply.')
        }
      })()
    },
    [isLive, live, spotLabel, win, refreshThreads, loadMessages, flash, fail],
  )

  const postWanted = useCallback(() => {
    const title = wantedDraft.trim()
    if (!title) return
    if (!isLive || !live) {
      setWantedDraft('')
      flash('Posted. People on campus can now offer you one.')
      return
    }
    void (async () => {
      try {
        await api.createWanted(live.campusId, live.userId, title)
        setWantedDraft('')
        await refreshWanted()
        flash('Posted. People on campus can now offer you one.')
      } catch (e) {
        fail(e, 'Could not post that.')
      }
    })()
  }, [wantedDraft, isLive, live, refreshWanted, flash, fail])

  // ── profile ────────────────────────────────────────────────────────────────
  /** Where this person prefers to hand things over — public, on campus, and the
   *  default the claim and post flows start from. */
  const setPreferredSpot = useCallback(
    (value: string) => {
      if (!live) return
      void (async () => {
        try {
          await api.updatePreferredSpot(live.userId, value)
          live.refreshProfile()
          setSpotName(value)
          flash('Saved. Your claims and listings start here.')
        } catch (e) {
          fail(e, 'Could not save that.')
        }
      })()
    },
    [live, flash, fail],
  )

  /**
   * Ask the browser once, round hard, and store it. Declining is a normal
   * answer: without a location the board simply stops sorting by distance.
   */
  const shareLocation = useCallback(() => {
    if (!live || !navigator.geolocation) {
      flash('This browser cannot share a location.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void (async () => {
          const ok = await api.setMyLocation(pos.coords.latitude, pos.coords.longitude)
          setLocating(false)
          if (!ok) {
            flash('Could not save that.')
            return
          }
          live.refreshProfile()
          api.fetchDistances().then(setDistances).catch(() => {})
          flash('Saved to about 100 metres. Nobody sees where you are — only how far away a thing is.')
        })()
      },
      () => {
        setLocating(false)
        flash('No location shared. The board still works, it just will not sort by distance.')
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    )
  }, [live, flash])

  const forgetLocation = useCallback(() => {
    if (!live) return
    void (async () => {
      await api.clearMyLocation()
      setDistances(new Map())
      live.refreshProfile()
      flash('Forgotten. Distances are off.')
    })()
  }, [live, flash])

  /** Distance to a listing in km, when both sides have shared a coarse point. */
  const distanceOf = useCallback(
    (it: Item): number | null => (it.uuid ? (distances.get(it.uuid) ?? null) : null),
    [distances],
  )

  const saveProfileDetails = useCallback(
    (fields: { pronouns?: string; about?: string }) => {
      if (!live) return
      void (async () => {
        try {
          await api.updateProfileDetails(live.userId, fields)
          live.refreshProfile()
          flash('Saved.')
        } catch (e) {
          fail(e, 'Could not save that.')
        }
      })()
    },
    [live, flash, fail],
  )

  /** Rate the person on the other side of a finished handoff, once. */
  const rateThread = useCallback(
    (stars: number, note: string) => {
      const t = activeThread
      if (!live || !t || !t.completed || !t.otherId) return
      void (async () => {
        try {
          await api.rateHandoff(t.id, live.userId, t.otherId!, stars, note)
          await refreshThreads()
          api.fetchRatingSummary(live.userId).then(setRating).catch(() => {})
          flash('Thanks — that helps the next person decide.')
        } catch {
          flash('You have already rated this one.')
        }
      })()
    },
    [live, activeThread, refreshThreads, flash],
  )

  /** Offer to carry something heavy, at your own price. */
  const offerCarry = useCallback(
    (it: Item, fee: number, note: string) => {
      if (!live || !it.uuid) return
      void (async () => {
        try {
          await api.offerCarry(it.uuid!, live.userId, fee, note)
          setCarryOffers(await api.fetchCarryOffers())
          flash('Offer sent. They pick one, and you get paid directly.')
        } catch {
          flash('You have already offered on this one.')
        }
      })()
    },
    [live, flash],
  )

  /** The owner picks a carrier; that person joins the handoff as its helper. */
  const acceptCarry = useCallback(
    (offerId: string) => {
      void (async () => {
        const ok = await api.acceptCarry(offerId)
        setCarryOffers(await api.fetchCarryOffers())
        flash(ok ? 'Booked. They are on the thread now.' : 'Could not book that one.')
      })()
    },
    [flash],
  )

  /** Offers on my own listings, waiting for an answer. */
  const offersOnMine = useMemo(
    () => carryOffers.filter((o) => o.helperId !== userId && o.status === 'pending'),
    [carryOffers, userId],
  )

  /** What I offered to carry, and where it stands. */
  const myCarryOffers = useMemo(
    () => carryOffers.filter((o) => o.helperId === userId),
    [carryOffers, userId],
  )

  /**
   * Report someone, which also blocks them. The board stops showing their
   * things immediately — enforced by the listings policy, not by the client —
   * and a founder picks the report up in the moderation queue.
   */
  const reportAccount = useCallback(
    (subjectId: string, reason: string, note: string, listingUuid?: string | null, threadId?: string | null) => {
      if (!live || !subjectId) return
      void (async () => {
        const ok = await api.reportAccount(subjectId, reason, note, listingUuid, threadId)
        if (!ok) {
          flash('Could not send that report.')
          return
        }
        await refreshBoard()
        await refreshThreads()
        flash('Reported. That account is hidden from your board and flagged for review.')
        go('browse')
      })()
    },
    [live, flash, refreshBoard, refreshThreads, go],
  )

  const setDisplayName = useCallback(
    (value: string) => {
      if (!live) return
      void (async () => {
        try {
          await api.updateName(live.userId, value)
          live.refreshProfile()
          await refreshBoard()
          flash('Name updated.')
        } catch (e) {
          fail(e, 'Could not save that.')
        }
      })()
    },
    [live, refreshBoard, flash, fail],
  )

  const acceptRules = useCallback(() => {
    if (!live) {
      setRulesAccepted(true)
      return
    }
    setRulesAccepted(true)
    void api.acceptRules(live.userId, RULES_VERSION)
  }, [live])

  /** "It is not that" on an ambiguous match: let the post through, once. */
  const postAnyway = useCallback(() => {
    setRuleOverride(true)
    setRuleHits([])
  }, [])

  const editAfterFlag = useCallback(() => setRuleHits([]), [])

  const signOut = useCallback(() => {
    void live?.signOut()
  }, [live])

  return {
    // state
    live: isLive,
    screen,
    tab: effectiveTab,
    q,
    selId,
    gone,
    extra,
    items,
    spot,
    spotName,
    win,
    msgs,
    draftMsg,
    photo,
    photoPreview,
    postText,
    edit,
    postedTitle,
    postedNote,
    moveOut: effectiveMoveOut,
    alerts,
    toast,
    liveCount,
    parse,
    busy,
    loadingBoard,
    rulesAccepted,
    rulesLoading,
    ruleHits,
    error,
    campusName,
    campusLogo,
    radiusKm,
    locating,
    hasLocation: Boolean(live?.lat != null),
    campusSpots: spots,
    wanted,
    wantedDraft,
    threads,
    activeThread,
    handoffState,
    confirming,
    me,
    myListings,
    staleListings,
    pausedListings,

    // setters
    setQ,
    setTab,
    setSpot,
    setSpotName,
    setWin,
    setDraftMsg,
    setPostText,
    setEdit,
    setAlerts,
    setMoveOut,
    setWantedDraft,
    needsHelp,
    setNeedsHelp,
    form,
    setField,
    maxPhotos: MAX_PHOTOS,
    kindsEnabled: KINDS_ENABLED,

    // helpers
    all,
    item,
    isFree,
    priceOf,
    kindOf,
    daysOf,
    isPaused,
    isStale,
    spotLabel,

    // actions
    flash,
    go,
    signIn,
    signOut,
    jumpBrowse,
    jumpChats,
    jumpMe,
    jumpWanted,
    jumpChat,
    jumpClaim,
    openDetail,
    openThread,
    back,
    startPost,
    shoot,
    pickPhoto,
    toStep1,
    toStep2,
    useExample,
    onEditValue,
    publish,
    confirmClaim,
    sendText,
    markHandedOff,
    confirmStill,
    markGoneStale,
    makeFree,
    relist,
    toggleGone,
    offerWanted,
    postWanted,
    setPreferredSpot,
    saveProfileDetails,
    rateThread,
    reportAccount,
    offerCarry,
    acceptCarry,
    offersOnMine,
    myCarryOffers,
    shareLocation,
    forgetLocation,
    distanceOf,
    setRadiusKm,
    setDisplayName,
    acceptRules,
    postAnyway,
    editAfterFlag,
    refreshBoard,
  }
}

export type Barter = ReturnType<typeof useBarter>
