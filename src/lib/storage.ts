import type { Feedback, Settings } from '../types'

const FEEDBACK_KEY = 'bondfire:feedback:v1'
const SETTINGS_KEY = 'bondfire:settings:v1'
const NOTES_KEY = 'bondfire:notes:v1'
const DAILY_KEY = 'bondfire:daily:v1'
const JOURNEYS_KEY = 'bondfire:journeys:v1'
const LOG_KEY = 'bondfire:log:v1'
const PAIR_KEY = 'bondfire:pair:v1'
const DEVICE_KEY = 'bondfire:device:v1'
const PLAYERS_KEY = 'bondfire:players:v1'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, quota). The app still works for this visit.
  }
}

export type FeedbackMap = Record<string, Feedback>

export const loadFeedback = () => read<FeedbackMap>(FEEDBACK_KEY, {})
export const saveFeedback = (f: FeedbackMap) => write(FEEDBACK_KEY, f)

export const loadSettings = () => read<Settings>(SETTINGS_KEY, { mode: null, categories: [] })
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s)

export interface Note {
  text: string
  updatedAt: number
}
export type NotesMap = Record<string, Note>

export const loadNotes = () => read<NotesMap>(NOTES_KEY, {})
export const saveNotes = (n: NotesMap) => write(NOTES_KEY, n)

/** Daily question: which question was answered on which local date (YYYY-MM-DD). */
export type DailyMap = Record<string, { questionId: string; answeredAt: number }>

export const loadDaily = () => read<DailyMap>(DAILY_KEY, {})
export const saveDaily = (d: DailyMap) => write(DAILY_KEY, d)

/** Journeys: finished part indexes per journey id. */
export type JourneyProgress = Record<string, { done: number[]; updatedAt: number }>

export const loadJourneys = () => read<JourneyProgress>(JOURNEYS_KEY, {})
export const saveJourneys = (j: JourneyProgress) => write(JOURNEYS_KEY, j)

/** Things worth remembering that are not notes: finished journeys, games, written memories. */
export interface LogEntry {
  id: string
  at: number
  kind: 'journey' | 'guess' | 'party' | 'memory'
  title: string
  text?: string
  /** Guess my answer rounds */
  rounds?: { question: string; answerer: string; answer: string; guess: string; correct: boolean }[]
}

export const loadLog = () => read<LogEntry[]>(LOG_KEY, [])
export const saveLog = (l: LogEntry[]) => write(LOG_KEY, l)

/** Partner data as last received from the server. */
export interface PartnerData {
  name: string
  likes: string[]
  notes: NotesMap
  streak: number
  log: LogEntry[]
  updatedAt: number
}

export interface PairState {
  code: string
  name: string
  partner: PartnerData | null
  /** Liked-by-both ids the player has already seen on the Pair screen */
  seenMatches: string[]
  syncedAt: number
}

export const loadPair = () => read<PairState | null>(PAIR_KEY, null)
export const savePair = (p: PairState | null) => (p ? write(PAIR_KEY, p) : removeKey(PAIR_KEY))

export const loadPlayers = () => read<string[]>(PLAYERS_KEY, [])
export const savePlayers = (p: string[]) => write(PLAYERS_KEY, p)

/** Random id for this browser, used by the pairing server to tell phones apart. */
export function deviceId(): string {
  let id = read<string>(DEVICE_KEY, '')
  if (!id) {
    id = newId()
    write(DEVICE_KEY, id)
  }
  return id
}

export function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}

function removeKey(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function clearAll() {
  try {
    localStorage.removeItem(FEEDBACK_KEY)
    localStorage.removeItem(SETTINGS_KEY)
    localStorage.removeItem(NOTES_KEY)
    localStorage.removeItem(DAILY_KEY)
    localStorage.removeItem(JOURNEYS_KEY)
    localStorage.removeItem(LOG_KEY)
  } catch {
    // ignore
  }
}
