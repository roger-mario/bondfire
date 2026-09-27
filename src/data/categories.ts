import type { Mode } from '../types'

export type CategoryId =
  | 'warmup'
  | 'fun'
  | 'throwback'
  | 'deep'
  | 'dreams'
  | 'values'
  | 'us'
  | 'friends'
  | 'flirty'
  | 'gratitude'

export interface Category {
  id: CategoryId
  label: string
  emoji: string
  blurb: string
  /** Card gradient, from → to */
  colors: [string, string]
  /** Which modes this category is offered in */
  modes: Mode[]
}

export const CATEGORIES: Category[] = [
  { id: 'warmup', label: 'Warm-up', emoji: '☕', blurb: 'Easy openers', colors: ['#ff9a5a', '#ff5e62'], modes: ['couples', 'friends'] },
  { id: 'fun', label: 'Just for fun', emoji: '🎲', blurb: 'Silly hypotheticals', colors: ['#f7b733', '#fc4a1a'], modes: ['couples', 'friends'] },
  { id: 'throwback', label: 'Throwback', emoji: '📼', blurb: 'Memories and stories', colors: ['#c471f5', '#fa71cd'], modes: ['couples', 'friends'] },
  { id: 'deep', label: 'Deep talk', emoji: '🌊', blurb: 'The real stuff', colors: ['#4568dc', '#b06ab3'], modes: ['couples', 'friends'] },
  { id: 'dreams', label: 'Dreams', emoji: '✨', blurb: 'Future and ambitions', colors: ['#11998e', '#38ef7d'], modes: ['couples', 'friends'] },
  { id: 'values', label: 'Values', emoji: '🧭', blurb: 'What matters most', colors: ['#2193b0', '#6dd5ed'], modes: ['couples', 'friends'] },
  { id: 'us', label: 'Us', emoji: '💞', blurb: 'All about the two of you', colors: ['#ee0979', '#ff6a00'], modes: ['couples'] },
  { id: 'flirty', label: 'Flirty', emoji: '🔥', blurb: 'Turn up the heat', colors: ['#e53935', '#8e0e00'], modes: ['couples'] },
  { id: 'friends', label: 'Friendship', emoji: '🤝', blurb: 'About your bond', colors: ['#f953c6', '#b91d73'], modes: ['friends'] },
  { id: 'gratitude', label: 'Gratitude', emoji: '🙏', blurb: 'Say thank you', colors: ['#f2994a', '#f2c94c'], modes: ['couples', 'friends'] },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  Category
>

export function categoriesForMode(mode: Mode): Category[] {
  return CATEGORIES.filter((c) => c.modes.includes(mode))
}
