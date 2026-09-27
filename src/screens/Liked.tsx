import { useCallback, useState } from 'react'
import { NoteDialog } from '../components/NoteDialog'
import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories'
import { affinity, buildProfile } from '../lib/recommend'
import type { FeedbackMap, NotesMap } from '../lib/storage'
import type { Question, Vote } from '../types'

interface Props {
  questions: Question[]
  feedback: FeedbackMap
  setVote: (id: string, vote: Vote | undefined) => void
  notes: NotesMap
  setNote: (id: string, text: string) => void
  onBack: () => void
}

export function Liked({ questions, feedback, setVote, notes, setNote, onBack }: Props) {
  const [editing, setEditing] = useState<Question | null>(null)
  const closeNote = useCallback(() => setEditing(null), [])
  const noted = questions
    .filter((q) => notes[q.id] && feedback[q.id]?.vote !== 'up')
    .sort((a, b) => notes[b.id].updatedAt - notes[a.id].updatedAt)

  const liked = questions
    .filter((q) => feedback[q.id]?.vote === 'up')
    .sort((a, b) => (feedback[b.id]?.lastSeen ?? 0) - (feedback[a.id]?.lastSeen ?? 0))

  const profile = buildProfile(questions, feedback)
  const taste = CATEGORIES.map((c) => ({ c, t: profile.category[c.id] }))
    .filter((x) => x.t && x.t.up + x.t.down > 0)
    .sort((a, b) => affinity(b.t) - affinity(a.t))

  return (
    <main className="screen liked-screen">
      <header className="topbar">
        <button className="icon" onClick={onBack} aria-label="Back">
          ‹
        </button>
        <span className="counter">Liked & notes</span>
        <span className="icon" />
      </header>

      {taste.length > 0 && (
        <section className="taste">
          <h2>Your taste so far</h2>
          {taste.map(({ c, t }) => (
            <div key={c.id} className="taste-row">
              <span className="taste-label">
                {c.emoji} {c.label}
              </span>
              <span className="bar">
                <span
                  style={{
                    width: `${Math.round(affinity(t) * 100)}%`,
                    background: `linear-gradient(90deg, ${c.colors[0]}, ${c.colors[1]})`,
                  }}
                />
              </span>
            </div>
          ))}
        </section>
      )}

      {liked.length === 0 ? (
        <p className="empty-text">No liked questions yet. Swipe left or tap 👍 on the ones you love, and they'll be saved here.</p>
      ) : (
        <ul className="liked-list">
          {liked.map((q) => {
            const c = CATEGORY_BY_ID[q.category]
            return (
              <li key={q.id} style={{ borderLeftColor: c.colors[0] }}>
                <span className="liked-cat">
                  {c.emoji} {c.label}
                </span>
                <p>{q.text}</p>
                {notes[q.id] && <p className="note-text">✎ {notes[q.id].text}</p>}
                <div className="liked-actions">
                  <button className="link" onClick={() => setEditing(q)}>
                    {notes[q.id] ? 'Edit note' : 'Add note'}
                  </button>
                  <button className="link muted" onClick={() => setVote(q.id, undefined)}>
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {noted.length > 0 && (
        <section>
          <h2>Other notes</h2>
          <ul className="liked-list">
            {noted.map((q) => {
              const c = CATEGORY_BY_ID[q.category]
              return (
                <li key={q.id} style={{ borderLeftColor: c.colors[0] }}>
                  <span className="liked-cat">
                    {c.emoji} {c.label}
                  </span>
                  <p>{q.text}</p>
                  <p className="note-text">✎ {notes[q.id].text}</p>
                  <div className="liked-actions">
                    <button className="link" onClick={() => setEditing(q)}>
                      Edit note
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {editing && (
        <NoteDialog
          question={editing}
          initial={notes[editing.id]?.text ?? ''}
          onSave={(text) => setNote(editing.id, text)}
          onClose={closeNote}
        />
      )}
    </main>
  )
}
