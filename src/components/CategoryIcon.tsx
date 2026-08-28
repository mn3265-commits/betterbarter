import { BookOpen, Lamp, Laptop, Package, Shirt, Ticket } from 'lucide-react'
import { CATEGORY_COLOR, toCategory } from '../lib/taxonomy'

const ICONS = { BookOpen, Laptop, Lamp, Shirt, Ticket, Package }

const MAP: Record<string, keyof typeof ICONS> = {
  'Textbooks & Course Materials': 'BookOpen',
  Electronics: 'Laptop',
  'Furniture & Dorm Essentials': 'Lamp',
  'Fashion & Accessories': 'Shirt',
  'Tickets & Events': 'Ticket',
  Others: 'Package',
}

/**
 * The mark for a category. Categories became a fixed vocabulary when the board
 * became searchable, so they can carry a fixed icon — which is what lets a
 * person scan a board instead of reading it.
 */
export function CategoryIcon({
  category,
  size = 15,
  tinted = true,
}: {
  category: string
  size?: number
  tinted?: boolean
}) {
  const c = toCategory(category)
  const Icon = ICONS[MAP[c] ?? 'Package']
  return <Icon size={size} strokeWidth={1.9} style={{ flex: 'none', color: tinted ? CATEGORY_COLOR[c] : undefined }} />
}

/** The category's own colour, for a chip or a bar. */
export function categoryColor(category: string): string {
  return CATEGORY_COLOR[toCategory(category)]
}
