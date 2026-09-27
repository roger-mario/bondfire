import { useEffect, useRef, useState } from 'react'
import { TopBar } from '../components/QuestionCard'
import { CATEGORY_BY_ID } from '../data/categories'
import { createPair, joinPair, leavePair, PairError } from '../lib/pair'
import type { PairState } from '../lib/storage'
import type { Question } from '../types'

interface Props {
  pair: PairState | null
  setPair: (p: PairState | null) => void
  sync: () => Promise<void>
  syncError: string
  /** Question ids liked on both phones */
  matches: Question[]
  onSeenMatches: (ids: string[]) => void
  onBack: () => void
}

export function Pair({ pair, setPair, sync, syncError, matches, onSeenMatches, onBack }: Props) {
  const [name, setName] = useState(pair?.name ?? '')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/pair')
      .then((r) => (r.ok ? r.json() : { ready: false }))
      .then((j: { ready?: boolean }) => setReady(!!j.ready))
      .catch(() => setReady(false))
  }, [])

  // While waiting for the partner, check often; otherwise sync once on open.
  const waiting = !!pair && !pair.partner
  useEffect(() => {
    if (!pair) return
    void sync()
    if (!waiting) return
    const t = window.setInterval(() => void sync(), 5000)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair?.code, waiting])

  // Matches count as seen once the player leaves this screen.
  const matchIds = useRef<string[]>([])
  useEffect(() => {
    matchIds.current = matches.map((q) => q.id)
  })
  useEffect(() => () => onSeenMatches(matchIds.current), [onSeenMatches])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e instanceof PairError ? e.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const myName = name.trim() || 'Me'

  const create = () =>
    run(async () => {
      const res = await createPair(myName)
      setPair({ code: res.code, name: myName, partner: null, seenMatches: [], syncedAt: 0 })
    })

  const join = () =>
    run(async () => {
      const res = await joinPair(code, myName)
      setPair({ code: res.code, name: myName, partner: null, seenMatches: [], syncedAt: 0 })
    })

  const unpair = () =>
    run(async () => {
      if (!pair || !confirm('Unpair this phone? Your own likes and notes stay on this phone.')) return
      await leavePair(pair.code).catch(() => undefined)
      setPair(null)
    })

  const share = async () => {
    if (!pair) return
    const text = `Join me on Bondfire with pair code ${pair.code}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Bondfire', text, url: location.origin })
        return
      }
      await navigator.clipboard.writeText(pair.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Share sheet dismissed.
    }
  }

  if (!pair) {
    return (
      <main className="screen pair">
        <TopBar title="Pair phones" onBack={onBack} />
        <div className="game-intro">
          <div className="empty-emoji">📲💞📲</div>
          <p>
            Each of you swipes on your own phone. Bondfire shows the questions you both liked, and your notes and memories
            show up in each other's memory book.
          </p>
        </div>

        {ready === false && (
          <p className="notice">Pairing turns on once the database is connected in Vercel. Everything else works already.</p>
        )}

        <label className="field">
          <span>Your name</span>
          <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="So your partner knows it's you" />
        </label>

        <button className="primary" disabled={busy || ready === false} onClick={create}>
          Create a pair code
        </button>

        <div className="or">or join your partner</div>

        <form
          className="answer-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (code.trim().length === 6) void join()
          }}
        >
          <input
            className="code-input"
            value={code}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="CODE"
          />
          <button className="save" disabled={busy || code.length !== 6 || ready === false}>
            Join
          </button>
        </form>

        {error && <p className="error">{error}</p>}
      </main>
    )
  }

  const seen = new Set(pair.seenMatches)

  return (
    <main className="screen pair">
      <TopBar title="Pair phones" onBack={onBack} />

      {pair.partner ? (
        <div className="paired">
          <div className="paired-names">
            <span>{pair.name}</span>
            <span className="paired-heart">💞</span>
            <span>{pair.partner.name}</span>
          </div>
          <div className="paired-stats">
            <div>
              <strong>{matches.length}</strong>
              <span>matches</span>
            </div>
            <div>
              <strong>{pair.partner.likes.length}</strong>
              <span>{pair.partner.name}'s likes</span>
            </div>
            <div>
              <strong>🔥 {pair.partner.streak}</strong>
              <span>their streak</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="waiting">
          <p>Share this code with your partner. They open Bondfire, tap Pair phones and enter it.</p>
          <button className="code" onClick={share} aria-label="Share pair code">
            {pair.code.split('').map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </button>
          <button className="ghost" onClick={share}>
            {copied ? '✓ Copied' : 'Share code'}
          </button>
          <p className="hint">
            <span className="spinner" /> Waiting for your partner to join…
          </p>
        </div>
      )}

      {(error || syncError) && <p className="error">{error || syncError}</p>}

      {pair.partner && (
        <section>
          <h2>You both liked</h2>
          {matches.length === 0 ? (
            <p className="empty-text">No matches yet. Keep swiping, and when you both like a question it lands here.</p>
          ) : (
            <ul className="liked-list">
              {matches.map((q) => {
                const c = CATEGORY_BY_ID[q.category]
                return (
                  <li key={q.id} style={{ borderLeftColor: c.colors[0] }}>
                    <span className="liked-cat">
                      {c.emoji} {c.label} {!seen.has(q.id) && <span className="new-badge">New</span>}
                    </span>
                    <p>{q.text}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      <div className="row small pair-actions">
        {pair.partner && (
          <button className="link" disabled={busy} onClick={() => run(sync)}>
            ↻ Sync now
          </button>
        )}
        <button className="link muted" disabled={busy} onClick={unpair}>
          Unpair
        </button>
      </div>
    </main>
  )
}
