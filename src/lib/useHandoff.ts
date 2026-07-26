import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AGE_DAYS,
  AUTO_PAUSED,
  ITEMS,
  ME,
} from '../data/seed'
import type { EditField, Item, Message, Screen, Tab } from '../data/types'
import { parseListing } from './parse'

/** Presentation-only config that maps to the prototype's props. */
export interface HandoffConfig {
  moveOutBanner: boolean
  defaultTab: Tab
}

export function useHandoff(config: HandoffConfig) {
  const [screen, setScreen] = useState<Screen>('gate')
  const [tab, setTab] = useState<Tab | null>(null)
  const [q, setQ] = useState('')
  const [selId, setSelId] = useState(2)

  const [confirmed, setConfirmed] = useState<number[]>([])
  const [freed, setFreed] = useState<number[]>([])
  const [relisted, setRelisted] = useState<number[]>([])
  const [gone, setGone] = useState<number[]>([])
  const [extra, setExtra] = useState<Item[]>([])

  const [spot, setSpot] = useState('A dorm lobby or front desk')
  const [spotName, setSpotName] = useState('')
  const [win, setWin] = useState('Today 6–8pm')

  const [msgs, setMsgs] = useState<Message[]>([])
  const [draftMsg, setDraftMsg] = useState('')

  const [photo, setPhoto] = useState(false)
  const [postText, setPostText] = useState('')
  const [edit, setEdit] = useState<EditField | null>(null)
  const [oTitle, setOTitle] = useState<string | null>(null)
  const [oPrice, setOPrice] = useState<number | null>(null)
  const [oFree, setOFree] = useState<boolean | null>(null)
  const [oSpot, setOSpot] = useState<string | null>(null)

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

  const go = useCallback((next: Screen) => {
    setScreen(next)
    setToast(null)
  }, [])

  // ── derived helpers ──
  const all = useCallback((): Item[] => extra.concat(ITEMS), [extra])

  const effectiveTab: Tab = tab ?? config.defaultTab
  const effectiveMoveOut = moveOut === null ? config.moveOutBanner : moveOut

  const spotLabel = useCallback(
    () => spotName.trim() || spot.replace(/^A /, '').replace(/^a /, ''),
    [spot, spotName],
  )

  const item = useCallback(
    (id: number): Item => all().find((x) => x.id === id) || ITEMS[1],
    [all],
  )

  const isFree = useCallback((it: Item) => it.free || freed.includes(it.id), [freed])
  const priceOf = useCallback((it: Item) => (isFree(it) ? 'FREE' : '$' + it.price), [isFree])
  const daysOf = useCallback((it: Item) => AGE_DAYS[it.id] || 0, [])
  const isPaused = useCallback(
    (it: Item) => AUTO_PAUSED.includes(it.id) && !relisted.includes(it.id),
    [relisted],
  )
  const isStale = useCallback(
    (it: Item) => daysOf(it) >= 7 && !confirmed.includes(it.id) && !isPaused(it),
    [confirmed, daysOf, isPaused],
  )

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

  // ── messaging ──
  const sendText = useCallback(
    (text: string) => {
      if (!text.trim()) return
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
    [spotLabel],
  )

  // ── navigation ──
  const signIn = useCallback(() => go('browse'), [go])
  const jumpBrowse = useCallback(() => go('browse'), [go])
  const jumpChats = useCallback(() => go('chats'), [go])
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

  const jumpChat = useCallback(() => {
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
  }, [])

  // ── posting ──
  const startPost = useCallback(() => {
    setScreen('post1')
    setPhoto(false)
    setPostText('')
    setEdit(null)
    resetOverrides()
    setToast(null)
  }, [resetOverrides])

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
  }, [parse, extra.length, postText])

  // ── claim / meetup ──
  const confirmClaim = useCallback(() => {
    const d0 = item(selId)
    const first = d0.seller.split(' ')[0]
    setMsgs([
      { id: 1, who: 'me', text: 'Claimed the ' + d0.title.toLowerCase() + '. Does the window still work for you?' },
      { id: 2, who: 'them', text: 'Yes — I will bring it down. It is heavier than it looks, fair warning.' },
    ])
    setScreen('chat')
    flash('Held for 3 hours. ' + first + ' has been messaged.')
  }, [item, selId, flash])

  // ── lifecycle actions (day-7 check, mark gone, relist) ──
  const confirmStill = useCallback(
    (id: number) => {
      setConfirmed((prev) => prev.concat([id]))
      flash('Confirmed. Back to the top of its category, next check in 7 days.')
    },
    [flash],
  )
  const markGoneStale = useCallback(
    (id: number) => {
      setGone((prev) => prev.concat([id]))
      setConfirmed((prev) => prev.concat([id]))
      flash('Cleared off the board.')
    },
    [flash],
  )
  const makeFree = useCallback(
    (id: number) => {
      setFreed((prev) => prev.concat([id]))
      setConfirmed((prev) => prev.concat([id]))
      flash('Now free. Everyone with a matching saved search was pinged.')
    },
    [flash],
  )
  const relist = useCallback(
    (id: number) => {
      setRelisted((prev) => prev.concat([id]))
      setConfirmed((prev) => prev.concat([id]))
      flash('Relisted, dated today.')
    },
    [flash],
  )
  const toggleGone = useCallback(
    (id: number, isGone: boolean) => {
      setGone((prev) => (isGone ? prev.filter((g) => g !== id) : prev.concat([id])))
      flash(isGone ? 'Back on the board.' : 'Marked gone. It disappears from the board immediately.')
    },
    [flash],
  )

  const offerWanted = useCallback(
    (title: string, who: string) => {
      setMsgs([
        {
          id: 1,
          who: 'me',
          text: 'I have one — ' + title.split('—')[0].trim().toLowerCase() + '. Free if you can grab it tonight.',
        },
      ])
      setScreen('chat')
      flash('Reply sent to ' + who + '.')
    },
    [flash],
  )

  const liveCount = 142 + extra.length - gone.length

  return {
    // raw state
    screen,
    tab: effectiveTab,
    q,
    selId,
    gone,
    extra,
    spot,
    spotName,
    win,
    msgs,
    draftMsg,
    photo,
    postText,
    edit,
    postedTitle,
    postedNote,
    moveOut: effectiveMoveOut,
    alerts,
    toast,
    liveCount,
    parse,

    // setters used directly by inputs
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
    jumpBrowse,
    jumpChats,
    jumpMe,
    jumpWanted,
    jumpChat,
    jumpClaim,
    openDetail,
    back,
    startPost,
    shoot,
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
  }
}

export type Handoff = ReturnType<typeof useHandoff>
