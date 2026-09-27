import { useCallback, useEffect, useRef, useState } from 'react'
import { PairError, syncPair, type SharedData } from './pair'
import { loadPair, savePair, type PairState } from './storage'

/**
 * Keeps this phone's pair state and syncs with the partner: shortly after local
 * changes, when the app comes back to the foreground, and every 30 seconds.
 */
export function usePair(shared: SharedData) {
  const [pair, setPairState] = useState<PairState | null>(loadPair)
  const [syncError, setSyncError] = useState('')
  const pairRef = useRef(pair)
  const sharedRef = useRef(shared)
  useEffect(() => {
    sharedRef.current = shared
  })

  const setPair = useCallback((next: PairState | null | ((prev: PairState | null) => PairState | null)) => {
    const value = typeof next === 'function' ? next(pairRef.current) : next
    pairRef.current = value
    savePair(value)
    setPairState(value)
  }, [])

  const sync = useCallback(async () => {
    const current = pairRef.current
    if (!current) return
    try {
      const partner = await syncPair(current.code, current.name, sharedRef.current)
      setSyncError('')
      setPair((p) => (p && p.code === current.code ? { ...p, partner, syncedAt: Date.now() } : p))
    } catch (e) {
      if (e instanceof PairError && e.kind === 'gone') {
        setPair((p) => (p && p.code === current.code ? null : p))
        setSyncError('')
      } else {
        setSyncError(e instanceof Error ? e.message : 'Sync failed.')
      }
    }
  }, [setPair])

  const onSeenMatches = useCallback(
    (ids: string[]) => setPair((p) => (p ? { ...p, seenMatches: ids } : p)),
    [setPair],
  )

  const code = pair?.code
  const { likes, notes, streak, log } = shared

  // Upload shortly after local changes.
  useEffect(() => {
    if (!code) return
    const t = window.setTimeout(() => void sync(), 1500)
    return () => window.clearTimeout(t)
  }, [code, likes, notes, streak, log, sync])

  // Pull the partner's changes while the app is open.
  useEffect(() => {
    if (!code) return
    const onVisible = () => document.visibilityState === 'visible' && void sync()
    document.addEventListener('visibilitychange', onVisible)
    const t = window.setInterval(() => document.visibilityState === 'visible' && void sync(), 30_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(t)
    }
  }, [code, sync])

  return { pair, setPair, sync, syncError, onSeenMatches }
}
