import type { Mode, Question } from '../types'
import { fitsMode } from './recommend'
import type { DailyMap } from './storage'

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + days))
}

/** Small string hash (FNV-1a), stable across devices. */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * The question of the day. Everyone playing the same mode gets the same one on
 * the same date, so two paired phones see the same question. Medium and deep
 * questions only, since the daily one is meant to be talked through.
 */
export function dailyQuestion(questions: Question[], mode: Mode, key: string = dateKey()): Question {
  const pool = questions.filter((q) => fitsMode(q, mode) && q.depth >= 2)
  const list = pool.length ? pool : questions
  return list[hash(`${mode}:${key}`) % list.length]
}

export interface Streak {
  /** Days in a row, counting today if answered, else up to yesterday */
  current: number
  best: number
  answeredToday: boolean
}

export function streak(daily: DailyMap, today: string = dateKey()): Streak {
  const answeredToday = !!daily[today]
  let current = 0
  let day = answeredToday ? today : addDays(today, -1)
  while (daily[day]) {
    current++
    day = addDays(day, -1)
  }

  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of Object.keys(daily).sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return { current, best: Math.max(best, current), answeredToday }
}
