import type { CategoryId } from '../data/categories'
import type { Depth, Mode, Question } from '../types'
import type { FeedbackMap } from './storage'

/**
 * Recommendation engine.
 *
 * Every thumbs up / down is a vote for the question's category and its depth
 * (light / medium / deep). For each pick we use Thompson sampling: draw a
 * random "how much do they like this" value from a Beta(up + 1, down + 1)
 * distribution per category and per depth. Categories with lots of thumbs up
 * usually draw high, disliked ones usually draw low, and ones with few votes
 * draw anywhere, which keeps exploring them. Question-level history then
 * nudges the score: unseen questions come first, liked ones can return later,
 * disliked ones almost never come back.
 */

interface Tally {
  up: number
  down: number
}

export interface Profile {
  category: Partial<Record<CategoryId, Tally>>
  depth: Record<Depth, Tally>
}

export function buildProfile(questions: Question[], feedback: FeedbackMap): Profile {
  const profile: Profile = {
    category: {},
    depth: { 1: { up: 0, down: 0 }, 2: { up: 0, down: 0 }, 3: { up: 0, down: 0 } },
  }
  for (const q of questions) {
    const vote = feedback[q.id]?.vote
    if (!vote) continue
    const cat = (profile.category[q.category] ??= { up: 0, down: 0 })
    cat[vote]++
    profile.depth[q.depth][vote]++
  }
  return profile
}

/** Expected liking (0..1) for a tally, used for display. */
export function affinity(t: Tally | undefined): number {
  const up = t?.up ?? 0
  const down = t?.down ?? 0
  return (up + 1) / (up + down + 2)
}

export function fitsMode(q: Question, mode: Mode): boolean {
  return q.mode === 'both' || q.mode === mode
}

export interface PickOptions {
  questions: Question[]
  feedback: FeedbackMap
  mode: Mode
  categories: CategoryId[]
  /** Ids already shown in this session, never repeated within it */
  sessionSeen: Set<string>
  random?: () => number
}

export function pickNext({
  questions,
  feedback,
  mode,
  categories,
  sessionSeen,
  random = Math.random,
}: PickOptions): Question | null {
  const allowed = new Set(categories)
  const pool = questions.filter(
    (q) => fitsMode(q, mode) && allowed.has(q.category) && !sessionSeen.has(q.id),
  )
  if (pool.length === 0) return null

  const profile = buildProfile(questions, feedback)

  // One Thompson draw per category and depth for this pick.
  const catDraw = new Map<CategoryId, number>()
  for (const c of allowed) {
    const t = profile.category[c]
    catDraw.set(c, sampleBeta((t?.up ?? 0) + 1, (t?.down ?? 0) + 1, random))
  }
  const depthDraw: Record<Depth, number> = {
    1: sampleBeta(profile.depth[1].up + 1, profile.depth[1].down + 1, random),
    2: sampleBeta(profile.depth[2].up + 1, profile.depth[2].down + 1, random),
    3: sampleBeta(profile.depth[3].up + 1, profile.depth[3].down + 1, random),
  }

  const scores = pool.map((q) => {
    const f = feedback[q.id]
    let history = 1
    if (f?.vote === 'down') history = 0.03
    else if (f?.vote === 'up') history = 0.5
    else if (f?.seen) history = 0.3
    const base = catDraw.get(q.category)! * Math.sqrt(depthDraw[q.depth]) * history
    return base * base
  })

  return pool[weightedIndex(scores, random)]
}

function weightedIndex(weights: number[], random: () => number): number {
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) return Math.floor(random() * weights.length)
  let r = random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

// --- Beta sampling (via two Gamma draws, Marsaglia & Tsang) ---

function sampleNormal(random: () => number): number {
  let u = 0
  while (u === 0) u = random()
  const v = random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function sampleGamma(shape: number, random: () => number): number {
  if (shape < 1) {
    return sampleGamma(shape + 1, random) * Math.pow(random() || 1e-12, 1 / shape)
  }
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x: number
    let v: number
    do {
      x = sampleNormal(random)
      v = 1 + c * x
    } while (v <= 0)
    v = v * v * v
    const u = random()
    if (u < 1 - 0.0331 * x ** 4) return d * v
    if (Math.log(u || 1e-12) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}

export function sampleBeta(a: number, b: number, random: () => number = Math.random): number {
  const x = sampleGamma(a, random)
  const y = sampleGamma(b, random)
  return x / (x + y)
}
