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

export const RULES_VERSION = 3

export interface RuleSection {
  title: string
  body: string
  items?: string[]
}

export const RULES: RuleSection[] = [
  {
    title: 'Do not list anything that can hurt someone',
    body: 'Some things are off the board no matter how ordinary they feel on a campus:',
    items: [
      'Weapons and ammunition, of any kind',
      'Drugs, prescription medication, and anything sold as a study aid',
      'Alcohol, vapes, and tobacco',
      'Fake IDs, keys, ID cards, or anything that opens a door that is not yours',
      'Stolen, rented, or university-owned property',
      'Recalled, damaged, or hazardous items — chemicals, fireworks, a charger that got hot',
      'Live animals',
      'Coursework, exam material, or anything meant to be handed in as someone else’s work',
    ],
  },
  {
    title: 'Say what it actually is',
    body:
      'Post the thing in front of you, photograph it as it is, and name the flaws. "Works, one dent" is a better listing than "like new". If it is gone, mark it gone — a board full of things that already left is a dead board.',
  },
  {
    title: 'Keep the conversation in BetterBarter',
    body:
      'Do not swap phone numbers, email addresses, social handles or room numbers, and do not move the arrangement to another app. The thread here is the only record of what the two of you agreed, and both accounts behind it are verified — that is the entire reason this is safer than meeting someone from a public marketplace. Messages containing contact details will not send.',
  },
  {
    title: 'Meet somewhere public on campus, never in a room',
    body:
      'Hand things off at a library entrance, a dining hall door, a student centre, a department lobby, a campus gate — somewhere other people are, and somewhere you were going anyway. Nothing here assumes you live on campus. Do not give out your room number, do not go to anyone’s home, and if a meeting feels wrong, leave: no item is worth it.',
  },
  {
    title: 'Renting and swapping are between you two',
    body:
      'BetterBarter holds no deposit, no escrow and no insurance, and it will not decide who broke what. If you rent something out, rent out only what you can afford to lose and agree the return date in the thread. If you rent something, bring it back on time and in the state you got it. If you swap, both sides describe their thing honestly — a swap is two listings, not one.',
  },
  {
    title: 'Show up, or say you cannot',
    body:
      'Claiming holds the item for three hours and takes it away from someone else. If your plan changes, send one message. Two no-shows and you lose the ability to claim for a week.',
  },
  {
    title: 'Treat people like neighbours',
    body:
      'Everyone here is on your campus and had to prove it with a school email. No harassment, no pressure, no discrimination. Report anything that crosses a line — reporting hides that account from you and flags it for review.',
  },
  {
    title: 'What happens if you break this',
    body:
      'Listings that break these rules are removed. Accounts that break them can lose posting and claiming, or be suspended. Anything illegal is a matter for Public Safety or the police, not for us.',
  },
]

export const RULES_SUMMARY =
  'Nothing dangerous or illegal, describe things honestly, keep it in the app, meet in public on campus, bring back what you rent, and show up.'

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
