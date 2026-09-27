import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories'
import { affinity, buildProfile } from '../lib/recommend'
import type { FeedbackMap } from '../lib/storage'
import type { Question, Vote } from '../types'

interface Props {
  questions: Question[]
  feedback: FeedbackMap
  setVote: (id: string, vote: Vote | undefined) => void
  onBack: () => void
}

export function Liked({ questions, feedback, setVote, onBack }: Props) {
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
        <span className="counter">Liked questions</span>
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
        <p className="empty-text">No liked questions yet. Swipe right or tap 👍 on the ones you love, and they'll be saved here.</p>
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
                <button className="link muted" onClick={() => setVote(q.id, undefined)}>
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
