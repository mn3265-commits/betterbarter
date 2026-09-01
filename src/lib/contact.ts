/**
 * Keeping the conversation inside BetterBarter.
 *
 * Two people who have never met arrange to hand something over. The only
 * protection either of them has is that the arrangement is on the record: if a
 * handoff goes wrong, there is a thread showing what was agreed, and an account
 * behind each side of it. The moment that conversation moves to a personal
 * number or a social account, all of that is gone — and so is the reason the
 * board is safer than a public marketplace.
 *
 * So personal contact details are not a thing we discourage in the rules and
 * allow in the product. They do not send.
 *
 * The patterns below are deliberately conservative in the other direction too:
 * a price, a time, a date and a building name all contain digits, and none of
 * them should ever be mistaken for a phone number.
 */

export type ContactKind = 'phone' | 'email' | 'handle' | 'offsite' | 'room'

export interface ContactHit {
  kind: ContactKind
  /** What to say to the person, in their own terms. */
  why: string
}

/** Runs of digits long enough to be a phone number, in the shapes people write. */
const PHONE = /(?:\+?\d[\d\s().-]{6,}\d)/g

const EMAIL = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i

/** A social or messaging handle: "@someone", but not an email address. */
const HANDLE = /(^|[\s(])@[a-z0-9._]{3,}/i

/** Named ways of leaving the app. Payment apps are not here: money is settled
 *  between the two of them by design, and saying "Venmo" is not contact info. */
const OFFSITE =
  /\b(whats\s?app|wa\.me|telegram|t\.me|signal|snap(chat)?|instagram|insta|ig\b|line id|kakao|wechat|discord|imessage|text me at|call me at|dm me on)\b/i

/** A room, flat or apartment number — the one address the rules never allow. */
const ROOM = /\b(room|rm|apt|apartment|unit|flat|suite)\s*#?\s*\d{1,4}[a-z]?\b/i

/** True when a digit run is long enough, and not obviously a price or a time. */
function looksLikePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return false
  // "6-8pm", "12/05", "$40" and "2026" never reach seven digits, but a range of
  // times written as "6 8 30" could; require either a separator pattern or a
  // single unbroken run.
  const compact = raw.trim()
  if (/^\d{4}$/.test(compact)) return false
  return true
}

/**
 * Everything in this text that would take the conversation off the record.
 * Empty array means it can send.
 */
export function findContactInfo(text: string): ContactHit[] {
  const hits: ContactHit[] = []
  const t = text ?? ''

  if (EMAIL.test(t)) {
    hits.push({
      kind: 'email',
      why: 'Email addresses stay off the Marketplace — everything you agree here is the record if something goes wrong.',
    })
  }

  const phones = t.match(PHONE) ?? []
  if (phones.some(looksLikePhone)) {
    hits.push({
      kind: 'phone',
      why: 'Phone numbers are not allowed in messages. Arrange the meetup here, so there is a record of what you agreed.',
    })
  }

  if (!EMAIL.test(t) && HANDLE.test(t)) {
    hits.push({
      kind: 'handle',
      why: 'Social handles are not allowed. Keep the arrangement in BetterBarter, where both accounts are verified.',
    })
  }

  if (OFFSITE.test(t)) {
    hits.push({
      kind: 'offsite',
      why: 'Moving the conversation to another app is against the community rules — the thread here is what protects both of you.',
    })
  }

  if (ROOM.test(t)) {
    hits.push({
      kind: 'room',
      why: 'Never a room number, yours or theirs. Pick a public spot on campus instead.',
    })
  }

  return hits
}

/** One line for a toast or an inline warning. */
export function contactWarning(hits: ContactHit[]): string {
  if (!hits.length) return ''
  return hits[0].why
}
