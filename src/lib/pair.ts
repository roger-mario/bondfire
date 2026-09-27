import { deviceId, type LogEntry, type NotesMap, type PartnerData } from './storage'

/** What this phone shares with its partner. */
export interface SharedData {
  likes: string[]
  notes: NotesMap
  streak: number
  log: LogEntry[]
}

interface Member {
  name: string
  data: Partial<SharedData> | null
  updatedAt: number
}

export class PairError extends Error {
  /** 'unavailable' when the server has no database yet, 'offline' when it can't be reached */
  kind: 'unavailable' | 'offline' | 'not-found' | 'full' | 'gone' | 'other'
  constructor(kind: PairError['kind'], message: string) {
    super(message)
    this.kind = kind
  }
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  let res: Response
  try {
    res = await fetch('/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, deviceId: deviceId() }),
    })
  } catch {
    throw new PairError('offline', "Couldn't reach the server. Check your connection.")
  }
  const json = (await res.json().catch(() => null)) as ({ error?: string; kind?: PairError['kind'] } & T) | null
  if (!res.ok || !json) {
    if (res.status === 404 && !json) {
      throw new PairError('unavailable', 'Pairing is not available on this server yet.')
    }
    throw new PairError(json?.kind ?? 'other', json?.error ?? 'Something went wrong. Try again.')
  }
  return json
}

export const createPair = (name: string) => call<{ code: string }>({ action: 'create', name })

export const joinPair = (code: string, name: string) =>
  call<{ code: string }>({ action: 'join', code: code.trim().toUpperCase(), name })

export const leavePair = (code: string) => call<{ ok: true }>({ action: 'leave', code })

/** Upload this phone's data and get the partner's back (null when nobody joined yet). */
export async function syncPair(code: string, name: string, data: SharedData): Promise<PartnerData | null> {
  const res = await call<{ members: Member[] }>({ action: 'sync', code, name, data })
  const partner = res.members[0]
  if (!partner) return null
  return {
    name: partner.name,
    likes: partner.data?.likes ?? [],
    notes: partner.data?.notes ?? {},
    streak: partner.data?.streak ?? 0,
    log: partner.data?.log ?? [],
    updatedAt: partner.updatedAt,
  }
}
