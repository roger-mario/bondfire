/** Celebration shown after a thumbs up. A different one is picked each time. */
export type BurstKind = 'hearts' | 'confetti' | 'sparkles' | 'float' | 'pulse'

export const BURST_KINDS: BurstKind[] = ['hearts', 'confetti', 'sparkles', 'float', 'pulse']

let lastKind: BurstKind | null = null

/** Random kind, never the same one twice in a row. */
export function nextBurstKind(): BurstKind {
  const options = BURST_KINDS.filter((k) => k !== lastKind)
  lastKind = options[Math.floor(Math.random() * options.length)]
  return lastKind
}
