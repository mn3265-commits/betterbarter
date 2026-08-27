/**
 * The Handoff impact model — how a confirmed handoff becomes a circularity
 * number, and how much of that number is measured versus estimated.
 *
 * The rule this file exists to enforce: **never dress an estimate up as a
 * measurement.** Three levels, and the app always shows them in this order.
 *
 *   Level 1 — measured.   Confirmed handoffs. Both people tapped "handed off"
 *                         in the thread, so a real object changed hands between
 *                         two verified students. This is the primary metric and
 *                         the only one we will ever state without a qualifier.
 *   Level 2 — estimated.  Mass kept in use = item count × a typical mass for
 *                         its category. Ordinary objects, ordinary weights.
 *   Level 3 — estimated,  Avoided production emissions = mass × a per-kilogram
 *             conservative. cradle-to-gate factor × a displacement rate, because
 *                         a reused object only avoids manufacturing if it stops
 *                         someone buying a new one.
 *
 * Every choice below is deliberately conservative:
 *   · masses are typical dorm-scale items, not the heaviest thing in a category
 *   · emission factors take the LOW end of published life-cycle ranges
 *   · the displacement rate is 0.5 — we assume only half of handoffs replace a
 *     purchase that would otherwise have happened
 *
 * The result is a number we can defend line by line in front of someone who
 * does this for a living, which matters more than a big number.
 */

export const MODEL_VERSION = '1.1'

/**
 * Which ways of moving an object earn an avoided-production credit.
 *
 * A give-away, a sale and a swap all transfer the object: someone now has a
 * thing they would otherwise have bought. A **rental comes back** — the borrower
 * avoided a purchase for a week, the owner still owns it, and nobody can say
 * from the outside whether a purchase was actually prevented. So a rental is
 * counted as a reuse event and reported as one, and earns no carbon credit at
 * all. Under-claiming here is deliberate: it is the assumption most likely to
 * be challenged, so we give it away before anyone asks.
 */
export const TRANSFER_KINDS = ['free', 'sale', 'trade'] as const

/** Share of reuses assumed to displace the manufacture of a new item.
 *  Reuse literature spans roughly 0.3–1.0 depending on product and market; we
 *  hold it at the low-middle of that range and state it everywhere. */
export const DISPLACEMENT = 0.5

export interface CategoryFactor {
  /** Typical mass of one such item, kilograms. */
  kg: number
  /** Cradle-to-gate emissions of making a new one, kg CO2e per kg of product.
   *  Low end of published life-cycle ranges for the dominant material. */
  efPerKg: number
  /** What the pair of numbers assumes, in one line. */
  basis: string
}

/**
 * Keyed by the categories the listing parser produces (see `parse.ts`).
 * These are defaults for a first campus, not measurements of your object: a
 * poster who knows the real weight should be able to correct it, exactly like
 * every other parsed field.
 */
export const FACTORS: Record<string, CategoryFactor> = {
  Furniture: { kg: 12, efPerKg: 2.0, basis: 'Particleboard/wood desk, chair, shelf or rug; wood-panel furniture LCAs' },
  Kitchen: { kg: 4, efPerKg: 5.0, basis: 'Kettle, pan, mini appliance; mixed metal and plastic' },
  Tech: { kg: 2.5, efPerKg: 20.0, basis: 'Monitor, laptop, printer; electronics are emissions-dense per kilogram' },
  Bike: { kg: 12, efPerKg: 4.0, basis: 'Steel/aluminium frame bicycle' },
  Lamp: { kg: 1.5, efPerKg: 4.0, basis: 'Desk lamp; metal and plastic with a small driver board' },
  Clothes: { kg: 0.6, efPerKg: 12.0, basis: 'Coat, boots or sweater; garment production is emissions-dense per kilogram' },
  Books: { kg: 1.0, efPerKg: 1.5, basis: 'Textbook; paper and print' },
  Supplies: { kg: 1.0, efPerKg: 3.0, basis: 'Storage box, rack, hangers; mixed plastic' },
  Other: { kg: 2.0, efPerKg: 3.0, basis: 'Unclassified item; deliberately the most cautious pair in the table' },
}

const FALLBACK = FACTORS.Other

export interface Impact {
  /** Items whose handoff was confirmed by both people. Measured. */
  items: number
  /** Kilograms kept in use rather than thrown out. Estimated (level 2). */
  kg: number
  /** Kilograms of CO2e avoided. Estimated, displacement-adjusted (level 3). */
  co2e: number
}

export const ZERO: Impact = { items: 0, kg: 0, co2e: 0 }

/** One item of a category. `rent` keeps the mass, but earns no carbon credit. */
export function impactOfItem(category: string, kind: string = 'free'): Impact {
  const f = FACTORS[category] ?? FALLBACK
  const transfers = (TRANSFER_KINDS as readonly string[]).includes(kind)
  return { items: 1, kg: f.kg, co2e: transfers ? f.kg * f.efPerKg * DISPLACEMENT : 0 }
}

/** A tally of `{ category: count }` — what both impact RPCs return. */
export function impactOf(counts: Record<string, number>): Impact {
  let items = 0
  let kg = 0
  let co2e = 0
  for (const [cat, n] of Object.entries(counts)) {
    if (!n) continue
    const f = FACTORS[cat] ?? FALLBACK
    items += n
    kg += f.kg * n
    co2e += f.kg * f.efPerKg * DISPLACEMENT * n
  }
  return { items, kg, co2e }
}

/**
 * The category mix a forecast assumes, as shares of one item.
 *
 * An unweighted average of the table would be dishonest in our own favour: it
 * would treat a bicycle and a paperback as equally likely, and the two
 * emissions-dense categories (Tech, Bike) would carry a forecast they do not
 * carry in a real hallway. This mix is a first-campus assumption — what a dorm
 * floor actually puts out at move-out, weighted toward small things — and it
 * gets replaced by measured shares the moment the board has them.
 */
export const MIX: Record<string, number> = {
  Clothes: 0.2,
  Furniture: 0.15,
  Kitchen: 0.15,
  Supplies: 0.15,
  Books: 0.12,
  Lamp: 0.08,
  Tech: 0.08,
  Other: 0.05,
  Bike: 0.02,
}

/** One item of unknown category, priced at the assumed mix above. */
export function averageItem(): Impact {
  let kg = 0
  let co2e = 0
  for (const [cat, share] of Object.entries(MIX)) {
    const f = FACTORS[cat] ?? FALLBACK
    kg += f.kg * share
    co2e += f.kg * f.efPerKg * DISPLACEMENT * share
  }
  return { items: 1, kg, co2e }
}

/** Forecast for `students` people each handing off `perStudent` items. */
export function forecast(students: number, perStudent: number): Impact {
  const one = averageItem()
  const n = Math.max(0, Math.round(students)) * Math.max(0, Math.round(perStudent))
  return { items: n, kg: one.kg * n, co2e: one.co2e * n }
}

// ── formatting ────────────────────────────────────────────────────────────────

/** Mass, in the unit a person would actually say out loud. */
export function kgLabel(kg: number): string {
  if (kg >= 1000) return (kg / 1000).toFixed(kg >= 10_000 ? 0 : 1) + ' t'
  if (kg >= 100) return Math.round(kg) + ' kg'
  if (kg >= 10) return kg.toFixed(0) + ' kg'
  return kg.toFixed(1) + ' kg'
}

export function co2eLabel(kg: number): string {
  if (kg >= 1000) return (kg / 1000).toFixed(kg >= 10_000 ? 0 : 1) + ' t CO₂e'
  if (kg >= 10) return Math.round(kg) + ' kg CO₂e'
  return kg.toFixed(1) + ' kg CO₂e'
}

/**
 * The published sources behind the framing on the site. Kept here so the page
 * and the pitch cannot drift from each other.
 */
export const SOURCES: { claim: string; source: string; url: string }[] = [
  {
    claim: 'US furniture and furnishings: 12.1 million tons generated in 2018, 80.1% of it landfilled.',
    source: 'EPA, Durable Goods: Product-Specific Data',
    url: 'https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/durable-goods-product-specific-data',
  },
  {
    claim: 'US textiles: 17 million tons generated in 2018; 11.3 million tons landfilled.',
    source: 'EPA, Textiles: Material-Specific Data',
    url: 'https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/textiles-material-specific-data',
  },
  {
    claim: 'Re-use benefits depend on displacement: a re-used item only avoids production if it replaces a purchase.',
    source: 'WRAP, Environmental and Economic Benefits of Re-use',
    url: 'https://www.wrap.ngo/resources/tool/environmental-and-economic-benefits-re-use',
  },
]
