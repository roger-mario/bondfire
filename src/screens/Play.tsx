import { useRef, useState } from 'react'
import { PeekCard, SwipeCard, type SwipeCardHandle, type SwipeDir } from '../components/SwipeCard'
import type { CategoryId } from '../data/categories'
import { pickNext } from '../lib/recommend'
import type { FeedbackMap } from '../lib/storage'
import type { Feedback, Mode, Question } from '../types'

interface Props {
  questions: Question[]
  feedback: FeedbackMap
  mode: Mode
  categories: CategoryId[]
  updateFeedback: (fn: (prev: FeedbackMap) => FeedbackMap) => void
  onBack: () => void
  onLiked: () => void
}

interface HistoryEntry {
  question: Question
  prev: Feedback | undefined
}

const HINT_KEY = 'bondfire:hint-seen'

function hintSeen() {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return false
  }
}

export function Play({ questions, feedback, mode, categories, updateFeedback, onBack, onLiked }: Props) {
  // Mutable set of ids shown this session; kept stable across renders.
  const [sessionSeen] = useState(() => new Set<string>())
  const cardRef = useRef<SwipeCardHandle>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHint, setShowHint] = useState(() => !hintSeen())

  const pick = (fb: FeedbackMap) => {
    const q = pickNext({ questions, feedback: fb, mode, categories, sessionSeen })
    if (q) sessionSeen.add(q.id)
    return q
  }

  const [deck, setDeck] = useState<{ current: Question | null; next: Question | null }>(() => {
    const current = pick(feedback)
    return { current, next: current ? pick(feedback) : null }
  })
  const [count, setCount] = useState(0)

  const handleSwiped = (dir: SwipeDir) => {
    const q = deck.current
    if (!q) return
    const prev = feedback[q.id]
    const nextFeedback: FeedbackMap = {
      ...feedback,
      [q.id]: {
        seen: (prev?.seen ?? 0) + 1,
        lastSeen: Date.now(),
        vote: dir === 'right' ? 'up' : dir === 'left' ? 'down' : prev?.vote,
      },
    }
    updateFeedback(() => nextFeedback)
    setHistory((h) => [...h.slice(-19), { question: q, prev }])
    setCount((c) => c + 1)
    setDeck({ current: deck.next, next: deck.next ? pick(nextFeedback) : null })
    if (showHint) {
      setShowHint(false)
      try {
        localStorage.setItem(HINT_KEY, '1')
      } catch {
        // ignore
      }
    }
  }

  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((h) => h.slice(0, -1))
    updateFeedback((fb) => {
      const copy = { ...fb }
      if (last.prev) copy[last.question.id] = last.prev
      else delete copy[last.question.id]
      return copy
    })
    // The card that was "next" goes back into the pool.
    if (deck.next) sessionSeen.delete(deck.next.id)
    setDeck({ current: last.question, next: deck.current })
    setCount((c) => Math.max(0, c - 1))
  }

  const restart = () => {
    sessionSeen.clear()
    setHistory([])
    const current = pick(feedback)
    setDeck({ current, next: current ? pick(feedback) : null })
  }

  const likedCount = Object.values(feedback).filter((f) => f.vote === 'up').length

  return (
    <main className="screen play">
      <header className="topbar">
        <button className="icon" onClick={onBack} aria-label="Back to menu">
          ‹
        </button>
        <span className="counter">{count > 0 ? `${count} answered` : mode === 'couples' ? '💑 Couples' : '🫶 Friends'}</span>
        <button className="icon liked" onClick={onLiked} aria-label="Liked questions">
          👍 <small>{likedCount}</small>
        </button>
      </header>

      <div className="deck">
        {deck.current ? (
          <>
            {deck.next && <PeekCard key={`peek-${deck.next.id}`} question={deck.next} />}
            <SwipeCard key={deck.current.id} ref={cardRef} question={deck.current} onSwiped={handleSwiped} />
            {showHint && (
              <div className="hint" aria-hidden>
                <span>👎 ← swipe →  👍</span>
                <span>swipe up to skip</span>
              </div>
            )}
          </>
        ) : (
          <div className="empty">
            <div className="empty-emoji">🎉</div>
            <h2>You've been through them all</h2>
            <p>Shuffle again and your favorite kinds of questions will come up first.</p>
            <button className="primary" onClick={restart}>
              Shuffle again
            </button>
            <button className="link" onClick={onBack}>
              Change categories
            </button>
          </div>
        )}
      </div>

      <footer className="controls">
        <button className="ctrl small" onClick={undo} disabled={history.length === 0} aria-label="Undo">
          ↺
        </button>
        <button className="ctrl nope" onClick={() => cardRef.current?.swipe('left')} disabled={!deck.current} aria-label="Thumbs down">
          👎
        </button>
        <button className="ctrl skip" onClick={() => cardRef.current?.swipe('up')} disabled={!deck.current} aria-label="Skip">
          ⤼
        </button>
        <button className="ctrl like" onClick={() => cardRef.current?.swipe('right')} disabled={!deck.current} aria-label="Thumbs up">
          👍
        </button>
      </footer>
    </main>
  )
}
