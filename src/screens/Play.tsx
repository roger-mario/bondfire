import { useCallback, useRef, useState } from 'react'
import { PeekCard, SwipeCard, type SwipeCardHandle, type SwipeDir } from '../components/SwipeCard'
import type { CategoryId } from '../data/categories'
import { fitsMode, pickNext } from '../lib/recommend'
import { NoteDialog } from '../components/NoteDialog'
import type { FeedbackMap, NotesMap } from '../lib/storage'
import type { Feedback, Mode, Question } from '../types'

interface Props {
  questions: Question[]
  feedback: FeedbackMap
  mode: Mode
  categories: CategoryId[]
  shuffle: boolean
  updateFeedback: (fn: (prev: FeedbackMap) => FeedbackMap) => void
  notes: NotesMap
  setNote: (id: string, text: string) => void
  onBack: () => void
  onLiked: () => void
}

interface HistoryEntry {
  question: Question
  prev: Feedback | undefined
}

export function Play({ questions, feedback, mode, categories, shuffle, updateFeedback, notes, setNote, onBack, onLiked }: Props) {
  // Mutable set of ids shown this session; kept stable across renders.
  const [sessionSeen] = useState(() => new Set<string>())
  const cardRef = useRef<SwipeCardHandle>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [noteOpen, setNoteOpen] = useState(false)
  const closeNote = useCallback(() => setNoteOpen(false), [])

  const pick = (fb: FeedbackMap) => {
    const q = pickNext({ questions, feedback: fb, mode, categories, sessionSeen, shuffle })
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
        vote: dir === 'left' ? 'up' : dir === 'right' ? 'down' : prev?.vote,
      },
    }
    updateFeedback(() => nextFeedback)
    setHistory((h) => [...h.slice(-19), { question: q, prev }])
    setCount((c) => c + 1)
    setDeck({ current: deck.next, next: deck.next ? pick(nextFeedback) : null })
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

  // Forget which questions in this selection were played (votes are kept).
  const restart = () => {
    const allowed = new Set(categories)
    const fresh: FeedbackMap = { ...feedback }
    for (const q of questions) {
      const f = fresh[q.id]
      if (f?.seen && allowed.has(q.category) && fitsMode(q, mode)) fresh[q.id] = { ...f, seen: 0 }
    }
    updateFeedback(() => fresh)
    sessionSeen.clear()
    setHistory([])
    const current = pick(fresh)
    setDeck({ current, next: current ? pick(fresh) : null })
  }

  const likedCount = Object.values(feedback).filter((f) => f.vote === 'up').length

  return (
    <main className="screen play">
      <header className="topbar">
        <button className="icon" onClick={onBack} aria-label="Back to menu">
          ‹
        </button>
        <span className="counter">{count > 0 ? `${count} answered` : `${mode === 'couples' ? '💑 Couples' : '🫶 Friends'}${shuffle ? ' · Random' : ''}`}</span>
        <button className="icon liked" onClick={onLiked} aria-label="Liked questions">
          👍 <small>{likedCount}</small>
        </button>
      </header>

      <div className="deck">
        {deck.current ? (
          <>
            {deck.next && <PeekCard key={`peek-${deck.next.id}`} question={deck.next} />}
            <SwipeCard
              key={deck.current.id}
              ref={cardRef}
              question={deck.current}
              onSwiped={handleSwiped}
              onUndo={undo}
              canUndo={history.length > 0}
              onNote={() => setNoteOpen(true)}
              hasNote={!!notes[deck.current.id]}
            />
          </>
        ) : (
          <div className="empty">
            <div className="empty-emoji">🎉</div>
            <h2>You've played them all</h2>
            <p>Every question in this selection has been swiped. Start over to play them again, or pick other categories.</p>
            <button className="primary" onClick={restart}>
              Start over
            </button>
            <button className="link" onClick={onBack}>
              Change categories
            </button>
          </div>
        )}
      </div>

      {noteOpen && deck.current && (
        <NoteDialog
          question={deck.current}
          initial={notes[deck.current.id]?.text ?? ''}
          onSave={(text) => setNote(deck.current!.id, text)}
          onClose={closeNote}
        />
      )}
    </main>
  )
}
