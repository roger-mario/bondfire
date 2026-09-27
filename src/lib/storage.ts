import type { Feedback, Settings } from '../types'

const FEEDBACK_KEY = 'bondfire:feedback:v1'
const SETTINGS_KEY = 'bondfire:settings:v1'

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

export function clearAll() {
  try {
    localStorage.removeItem(FEEDBACK_KEY)
    localStorage.removeItem(SETTINGS_KEY)
  } catch {
    // ignore
  }
}
