import type { ListingKind, ParseResult } from '../data/types'

/**
 * Overrides that win over the parse. Any user correction ("Fix") becomes an
 * override for that one field. `null` means "use the parse".
 */
export interface ParseOverrides {
  oTitle: string | null
  oPrice: number | null
  oFree: boolean | null
  oSpot: string | null
  /** The free-text meetup name chosen in the claim/post flow, if any. */
  spotName: string
}

/**
 * Reads a plain paragraph and fills the listing in — nobody types into a form.
 * Ported from the design handoff's `parse()`. All matching is case-insensitive
 * on the raw text.
 *
 * In production, replace these regexes with server-side extraction (or an LLM
 * call) but keep the UX contract: show what was understood, let any of it be
 * corrected in one tap, and never block posting on a field.
 */
export function parseListing(rawText: string, o: ParseOverrides): ParseResult {
  const t = rawText.trim()
  const low = t.toLowerCase()

  // Price: first $-amount or "N dollars/bucks/usd".
  const money = low.match(/\$\s?(\d{1,4})|\b(\d{1,4})\s?(dollars|bucks|usd)\b/)
  const priceRead = money ? parseInt(money[1] || money[2], 10) : null

  // Free: give-away words, but only when no price was stated. Empty text = free.
  const freeWord = /\b(free|giving it away|give it away|giving away|take it|no charge|whoever wants)\b/.test(low)

  // Renting: "$5 a week", "borrow it for the term", "lending my drill".
  const rentWord = /\b(rent|renting|rent out|borrow|borrowing|lend|lending|loan|per week|a week|per day|a day|per month|a month|for the term)\b/.test(low)
  const rateMatch = low.match(
    /\$?\s?(\d{1,4})\s?(?:dollars|bucks|usd)?\s*(?:\/|per|a|each)\s*(day|week|month|term|semester)\b/,
  )
  const rentRateRead = rateMatch ? parseInt(rateMatch[1], 10) : null
  const rentPeriodRead = rateMatch ? rateMatch[2].replace('semester', 'term') : 'week'

  // Swapping: "swap for a fan", "trade for headphones", "looking to exchange".
  const tradeWord = /\b(swap|swapping|trade|trading|exchange|in exchange for)\b/.test(low)
  // "swap for a fan" and "swapping my heater for a fan" both have to work, so
  // allow the object being offered to sit between the verb and the "for".
  const tradeMatch = low.match(/\b(?:swap|swapping|trade|trading|exchange)\b[^.,!?]{0,40}?\bfor\s+([^.,!?]{2,40})/)
  const tradeForRead = tradeMatch ? tradeMatch[1].trim() : ''

  const kind: ListingKind = rentWord && (rateMatch || /\b(rent|borrow|lend|loan)\b/.test(low))
    ? 'rent'
    : tradeWord
      ? 'trade'
      : priceRead !== null
        ? 'sale'
        : freeWord || !t
          ? 'free'
          : 'sale'

  const free = o.oFree !== null ? o.oFree : kind === 'free'

  // Title: strip greetings and lead-ins, cut at first punctuation, keep 6 words.
  let title = t
    // The price belongs in the price field, not in the name of the thing.
    .replace(/\bfor\s*\$?\s?\d{1,4}\s?(dollars|bucks|usd)?\b/i, '')
    .replace(/\$\s?\d{1,4}\b/g, '')
    .replace(/^(hi|hey|so)[,! ]+/i, '')
    .replace(/^(i am|i'm|im)\s+(selling|giving away|getting rid of)\s+(my|a|an|the)?\s*/i, '')
    .replace(/^(selling|giving away|free|getting rid of|anyone want)\s+(my|a|an|the)?\s*/i, '')
    .split(/[,.!\n]/)[0]
    .split(' ')
    .filter(Boolean)
    .slice(0, 6)
    .join(' ')
  if (title) title = title[0].toUpperCase() + title.slice(1)

  const catOf = (): string => {
    if (/lamp|light|bulb/.test(low)) return 'Lamp'
    if (/fridge|microwave|kettle|rice cooker|pan|pot|dish|mug|plates|toaster/.test(low)) return 'Kitchen'
    if (/desk|chair|rug|mirror|shelf|table|dresser|couch|futon|bed frame/.test(low)) return 'Furniture'
    if (/monitor|laptop|keyboard|charger|cable|printer|speaker|screen/.test(low)) return 'Tech'
    if (/bike|lock|helmet/.test(low)) return 'Bike'
    if (/box|tape|hanger|caddy|rack/.test(low)) return 'Supplies'
    if (/jacket|coat|shoes|boots|sweater/.test(low)) return 'Clothes'
    if (/textbook|book|notes/.test(low)) return 'Books'
    return 'Other'
  }

  const condOf = (): string => {
    if (/barely used|like new|brand new|never used/.test(low)) return 'Like new'
    if (/broken|does not work|doesn't work|cracked/.test(low)) return 'Broken'
    if (/dent|scratch|scuff|stain|worn/.test(low)) return 'Some marks'
    if (/works|working|fine/.test(low)) return 'Works'
    return 'Used'
  }

  // Spot: campus-specific names come from the school's accumulated spot list,
  // not an editorial one. Here they stand in for that list.
  const spotOf = (): string => {
    if (o.oSpot) return o.oSpot
    if (o.spotName.trim()) return o.spotName.trim()
    if (/front desk|lobby/.test(low)) return 'Carman front desk'
    if (/dining|john jay|ferris/.test(low)) return 'John Jay dining doors'
    if (/librar|butler/.test(low)) return 'Butler steps'
    if (/gate|quad|campus walk/.test(low)) return 'Main gate on 116th'
    return 'Carman front desk'
  }

  const whenOf = (): string => {
    if (/tonight|today|before \d|by \d/.test(low)) return 'Today 6–8pm'
    if (/tomorrow/.test(low)) return 'Tomorrow 12–2pm'
    if (/sunday|weekend/.test(low)) return 'Sunday 4–6pm'
    return 'Today 6–8pm'
  }

  return {
    title: o.oTitle !== null ? o.oTitle : title || 'Untitled thing',
    // A price correction means the person meant to sell it, whatever the words said.
    kind: o.oPrice !== null ? 'sale' : o.oFree === true ? 'free' : kind,
    free,
    price: o.oPrice !== null ? o.oPrice : priceRead === null ? 10 : priceRead,
    tradeFor: tradeForRead,
    rentRate: rentRateRead ?? priceRead ?? 5,
    rentPeriod: rentPeriodRead,
    cat: catOf(),
    cond: condOf(),
    spot: spotOf(),
    when: whenOf(),
    empty: !t,
  }
}
