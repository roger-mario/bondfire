import type { CategoryId } from './data/categories'

export type Mode = 'couples' | 'friends'

export type Depth = 1 | 2 | 3

export interface Question {
  id: string
  text: string
  category: CategoryId
  /** Who the question fits */
  mode: Mode | 'both'
  /** 1 = light, 2 = medium, 3 = deep */
  depth: Depth
}

export type Vote = 'up' | 'down'

export interface Feedback {
  /** Last vote on this question, if any */
  vote?: Vote
  /** Times the question has been shown */
  seen: number
  /** Timestamp of the last time it was shown */
  lastSeen: number
}

export interface Settings {
  mode: Mode | null
  categories: CategoryId[]
  /** Random mode: every category, fully shuffled, no ranking */
  shuffle?: boolean
}
