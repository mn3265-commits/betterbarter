import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AGE_DAYS, AUTO_PAUSED, CAMPUS_SPOTS, ITEMS, ME, WANTED } from '../data/seed'
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

export interface HandoffConfig {
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
  handoffs: number
  noShows: number
  joinedAt: string | null
  refreshProfile: () => void
  signOut: () => Promise<void>
}

const EMPTY_ITEM: Item = {
  id: -1,
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

export function useHandoff(config: HandoffConfig, live?: LiveContext) {
  const isLive = Boolean(live)

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
  const [campusName, setCampusName] = useState(isLive ? '' : 'Columbia')
  const [loadingBoard, setLoadingBoard] = useState(isLive)
  const [error, setError] = useState<string | null>(null)

  const [spot, setSpot] = useState('A dorm lobby or front desk')
  const [spotName, setSpotName] = useState('')
  const [win, setWin] = useState('Today 6–8pm')

  const [msgs, setMsgs] = useState<Message[]>([])
  const [draftMsg, setDraftMsg] = useState('')
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

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
    } catch (e) {
      fail(e, 'Could not load the board.')
    } finally {
      setLoadingBoard(false)
    }
  }, [isLive, userId, fail])

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
    if (!isLive) return
    void refreshBoard()
    void refreshThreads()
    void refreshWanted()
    api.fetchSpots().then(setSpots).catch(() => {})
    api.fetchCampusName().then(setCampusName).catch(() => {})
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
  const priceOf = useCallback((it: Item) => (isFree(it) ? 'FREE' : '$' + it.price), [isFree])
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
      noShows: live.noShows,
      building: live.building ?? '',
    }
  }, [live])

  const liveCount = isLive
    ? items.filter((i) => i.status === 'active').length
    : 142 + extra.length - goneDemo.length

  const parse = useMemo(
    () => parseListing(postText, { oTitle, oPrice, oFree, oSpot, spotName }),
    [postText, oTitle, oPrice, oFree, oSpot, spotName],
  )

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
    const ch = api.subscribeMessages(activeThreadId, () => void loadMessages(activeThreadId))
    return () => {
      void ch.unsubscribe()
    }
  }, [isLive, activeThreadId, loadMessages])

  const openThread = useCallback(
    (threadId: string) => {
      setActiveThreadId(threadId)
      setScreen('chat')
      setToast(null)
      void loadMessages(threadId)
    },
    [loadMessages],
  )

  const sendText = useCallback(
    (text: string) => {
      if (!text.trim()) return
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
    [isLive, activeThreadId, userId, loadMessages, refreshThreads, fail, spotLabel],
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
    setToast(null)
  }, [resetOverrides])

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
    const p = parse
    const note = p.free
      ? 'It is on the board now. Anyone on campus with a matching saved search gets pinged.'
      : 'Listed at $' + p.price + '. It is on the board now.'

    if (!isLive || !live) {
      const it: Item = {
        id: 900 + extra.length,
        free: p.free,
        price: p.price,
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
      setPostedNote(
        p.free
          ? '3 people have a saved search that matches this. They are being pinged now.'
          : 'Listed at $' + p.price + '. Two people saved a search near this price.',
      )
      setScreen('posted')
      setToast(null)
      return
    }

    setBusy(true)
    void (async () => {
      try {
        const path = photoFile ? await api.uploadPhoto(photoFile, live.userId) : null
        await api.createListing({
          campusId: live.campusId,
          sellerId: live.userId,
          title: p.title,
          free: p.free,
          price: p.price,
          category: p.cat,
          condition: p.cond,
          spotName: p.spot,
          building: live.building ?? '',
          description: postText.trim(),
          photoPath: path,
        })
        await api.bumpSpot(live.campusId, p.spot)
        await refreshBoard()
        api.fetchSpots().then(setSpots).catch(() => {})
        setSpotName(p.spot)
        setWin(p.when)
        setPostedTitle(p.title.toUpperCase())
        setPostedNote(note)
        setScreen('posted')
        setToast(null)
      } catch (e) {
        fail(e, 'Could not post that. Try again.')
      } finally {
        setBusy(false)
      }
    })()
  }, [parse, isLive, live, extra.length, postText, photoFile, refreshBoard, fail])

  // ── claim ──────────────────────────────────────────────────────────────────
  const confirmClaim = useCallback(() => {
    const d0 = item(selId)
    const first = (d0.seller || 'them').split(' ')[0]

    if (!isLive || !live) {
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
        const opening = isFree(d0)
          ? `Claimed the ${d0.title.toLowerCase()}. Does ${win} at ${spotLabel()} work?`
          : `Is the ${d0.title.toLowerCase()} still available? I can do ${win} at ${spotLabel()}.`
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
  const setBuilding = useCallback(
    (value: string) => {
      if (!live) return
      void (async () => {
        try {
          await api.updateBuilding(live.userId, value)
          live.refreshProfile()
          flash('Saved. People in your hall see your listings first.')
        } catch (e) {
          fail(e, 'Could not save that.')
        }
      })()
    },
    [live, flash, fail],
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
    error,
    campusName,
    campusSpots: spots,
    wanted,
    wantedDraft,
    threads,
    activeThread,
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

    // helpers
    all,
    item,
    isFree,
    priceOf,
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
    confirmStill,
    markGoneStale,
    makeFree,
    relist,
    toggleGone,
    offerWanted,
    postWanted,
    setBuilding,
    setDisplayName,
    refreshBoard,
  }
}

export type Handoff = ReturnType<typeof useHandoff>
