/**
 * The community rules every account agrees to before it can use the board, and
 * the check that runs on a listing before it is posted.
 *
 * The rules exist because the handoff itself happens off-platform, in a lobby,
 * between two students. The app cannot supervise that meeting, so the things it
 * can control are: who gets in (a verified school email), what may be listed,
 * and where people meet (public, never a room).
 */

import { findContactInfo } from './contact'

export const RULES_VERSION = 5

/**
 * A human, reachable.
 *
 * The rules promise that reports are reviewed, and they are — the queue is real
 * and a founder works it. But a queue is not a person, and until now there was
 * no address anywhere in the product. Someone frightened at eleven at night,
 * someone whose swap went wrong, someone who needs an account gone: none of
 * them had anywhere to go.
 *
 * For a board of fifty people on one campus, the right answer is a founder's
 * own address, answered by a founder. Move it to a shared inbox when that stops
 * being true.
 */
export const SUPPORT_EMAIL = 'mn3265@columbia.edu'

export interface RuleSection {
  title: string
  body: string
  items?: string[]
}

/**
 * The rules, as Tessa rewrote them on 30 August.
 *
 * The old set was four screens of careful prose that a first-year at move-in
 * would scroll past to reach the button. Hers is five short things a person can
 * actually hold in their head, which is the only version that protects anybody:
 * a rule nobody read is not a rule. The banned-items list went with it — "no
 * dangerous or illegal items" carries the same weight and does not read like a
 * legal document at the door.
 */
export const RULES: RuleSection[] = [
  {
    title: 'No dangerous or illegal items, please.',
    body:
      'Nothing that can hurt someone, nothing that is not yours to give, and nothing you would not want to explain to Public Safety.',
  },
  {
    title: 'Be clear and honest, act in good faith.',
    body:
      'Post the item as it is, and name the flaws (if any). Respect the agreed upon meet up details and price.',
  },
  {
    title: 'Keep the conversation in BetterBarter.',
    body:
      'Refrain from swapping personal phone numbers, email addresses, social handles or room numbers. Refrain from moving the arrangement to another app. Your safety is our priority. Messages containing contact details will not be sent.',
  },
  {
    title: 'Meet somewhere public on or near campus.',
    body:
      'Conduct your meetups in a public space — a library entrance, a hall lobby, a cafeteria or the gym. Do not give out your room number, and do not go to anyone\'s home or room.',
  },
  {
    title: 'Something wrong? Write to us.',
    body:
      `Email us at ${SUPPORT_EMAIL} — a real person reads it and resolves the issue. If you are in danger or something has been stolen, please call Public Safety or the police first and us second. Anyone who behaves in violation of these guidelines will unfortunately be removed permanently.`,
  },
]

export const RULES_SUMMARY =
  'Do you promise to be a kind and respectful BetterBarter community member? Read our community guidelines below.'

// ── the pre-post check ────────────────────────────────────────────────────────

export type CheckLevel = 'blocked' | 'flagged'

export interface RuleHit {
  level: CheckLevel
  label: string
  why: string
}

/** Unambiguous — these cannot be posted at all. */
const BLOCKED: { re: RegExp; label: string; why: string }[] = [
  {
    re: /\b(handgun|firearm|pistol|rifle|shotgun|ammo|ammunition|bullets|taser|stun gun|switchblade|brass knuckles)\b/i,
    label: 'a weapon',
    why: 'Weapons and ammunition are never allowed on the board.',
  },
  {
    re: /\b(weed|marijuana|cannabis|edibles|shrooms|cocaine|molly|mdma|ketamine|lsd|acid tabs)\b/i,
    label: 'drugs',
    why: 'Drugs are not allowed, and this is not a place to arrange them.',
  },
  {
    re: /\b(adderall|vyvanse|ritalin|xanax|valium|percocet|oxycodone|oxy|codeine|modafinil)\b/i,
    label: 'prescription medication',
    why: 'Prescription medication cannot be handed between students, ever.',
  },
  {
    re: /\b(fake id|fake ids|forged id|someone else'?s id|id card|access card|key ?card|dorm key|master key)\b/i,
    label: 'an ID or a key',
    why: 'IDs, keys and access cards are not yours to pass on.',
  },
  {
    re: /\b(stolen|i found it in|took it from the (?:lounge|lobby|kitchen))\b/i,
    label: 'property that is not yours',
    why: 'Only post things that belong to you.',
  },
  {
    re: /\b(essay|term paper|problem set|exam answers|test bank|homework) for (?:sale|money|\$)/i,
    label: 'coursework',
    why: 'Coursework meant to be handed in as someone else’s work is off the board.',
  },
]

/** Plausible but often innocent — worth a pause, with a way to say it is fine. */
const FLAGGED: { re: RegExp; label: string; why: string }[] = [
  {
    re: /\b(beer|wine|vodka|whiskey|tequila|rum|liquor|alcohol|hard seltzer|four loko)\b/i,
    label: 'alcohol',
    why: 'Alcohol cannot be listed. If you mean glasses, an opener or an empty bottle, say that and post again.',
  },
  {
    re: /\b(vape|juul|e-?cig|nicotine|cigarettes|hookah|bong)\b/i,
    label: 'vapes or tobacco',
    why: 'Vapes, tobacco and smoking gear cannot be listed.',
  },
  {
    re: /\b(medication|medicine|pills|inhaler|antibiotics)\b/i,
    label: 'medicine',
    why: 'Medicine cannot be handed between students. If this is an empty case or a first-aid kit, say that.',
  },
  {
    re: /\b(kitten|puppy|hamster|rabbit|fish tank with|live fish|snake|lizard)\b/i,
    label: 'a live animal',
    why: 'Animals are not items. An empty tank or cage is fine — say that it is empty.',
  },
  {
    re: /\b(space heater|hot plate|halogen lamp|extension cord melted|frayed)\b/i,
    label: 'something that may be a fire risk',
    why: 'Many halls ban these outright. Make sure it is allowed and works safely before posting.',
  },
]

/** Runs over the listing paragraph before it is published. */
export function checkListing(text: string): RuleHit[] {
  const t = text.trim()
  if (!t) return []
  const hits: RuleHit[] = []

  // A listing is public to the whole campus, so contact details in one are
  // worse than in a message, not better.
  for (const c of findContactInfo(t)) {
    hits.push({ level: 'blocked', label: 'contact details', why: c.why })
  }

  for (const b of BLOCKED) {
    if (b.re.test(t)) hits.push({ level: 'blocked', label: b.label, why: b.why })
  }
  if (hits.length) return hits
  for (const f of FLAGGED) {
    if (f.re.test(t)) hits.push({ level: 'flagged', label: f.label, why: f.why })
  }
  return hits
}
