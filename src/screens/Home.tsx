import { categoriesForMode } from '../data/categories'
import { fitsMode } from '../lib/recommend'
import type { FeedbackMap } from '../lib/storage'
import type { Mode, Question, Settings } from '../types'

interface Props {
  questions: Question[]
  feedback: FeedbackMap
  settings: Settings
  onChange: (s: Settings) => void
  onStart: () => void
  onLiked: () => void
  onReset: () => void
}

const MODES: { id: Mode; label: string; emoji: string; sub: string }[] = [
  { id: 'couples', label: 'Couples', emoji: '💑', sub: 'For the two of you' },
  { id: 'friends', label: 'Friends', emoji: '🫶', sub: 'For your people' },
]

export function Home({ questions, feedback, settings, onChange, onStart, onLiked, onReset }: Props) {
  const { mode } = settings
  const shuffle = !!settings.shuffle
  const cats = mode ? categoriesForMode(mode) : []
  const selected = new Set(settings.categories.filter((c) => cats.some((x) => x.id === c)))
  const likedCount = Object.values(feedback).filter((f) => f.vote === 'up').length

  const pickMode = (m: Mode) =>
    onChange({ mode: m, categories: categoriesForMode(m).map((c) => c.id) })

  const toggle = (id: (typeof cats)[number]['id']) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange({ ...settings, shuffle: false, categories: [...next] })
  }

  const inSelection = mode
    ? questions.filter((q) => fitsMode(q, mode) && (shuffle || selected.has(q.category)))
    : []
  const available = inSelection.length
  const fresh = inSelection.filter((q) => !feedback[q.id]?.seen).length

  return (
    <main className="screen home">
      <header className="brand">
        <div className="logo" aria-hidden>🔥</div>
        <h1>Bondfire</h1>
        <p>Questions that bring you closer.</p>
      </header>

      <section>
        <h2>Who's playing?</h2>
        <div className="modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`mode ${mode === m.id ? 'active' : ''}`}
              onClick={() => pickMode(m.id)}
              aria-pressed={mode === m.id}
            >
              <span className="mode-emoji">{m.emoji}</span>
              <span className="mode-label">{m.label}</span>
              <span className="mode-sub">{m.sub}</span>
            </button>
          ))}
        </div>
      </section>

      {mode && (
        <section>
          <div className="row">
            <h2>Categories</h2>
            <button
              className="link"
              onClick={() =>
                onChange({
                  ...settings,
                  shuffle: false,
                  categories: !shuffle && selected.size === cats.length ? [] : cats.map((c) => c.id),
                })
              }
            >
              {!shuffle && selected.size === cats.length ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <button
            className={`cat random ${shuffle ? 'active' : ''}`}
            onClick={() => onChange({ ...settings, shuffle: !shuffle })}
            aria-pressed={shuffle}
          >
            <span className="cat-emoji">🔀</span>
            <span className="cat-text">
              <span className="cat-label">Random</span>
              <span className="cat-blurb">Every category, fully shuffled</span>
            </span>
          </button>
          <div className={`cats ${shuffle ? 'dimmed' : ''}`}>
            {cats.map((c) => (
              <button
                key={c.id}
                className={`cat ${!shuffle && selected.has(c.id) ? 'active' : ''}`}
                onClick={() => toggle(c.id)}
                aria-pressed={!shuffle && selected.has(c.id)}
                style={!shuffle && selected.has(c.id) ? { background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})` } : undefined}
              >
                <span className="cat-emoji">{c.emoji}</span>
                <span className="cat-text">
                  <span className="cat-label">{c.label}</span>
                  <span className="cat-blurb">{c.blurb}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="home-actions">
        <button className="primary" disabled={!mode || available === 0} onClick={onStart}>
          {mode ? (available ? (fresh ? `Start · ${fresh} new questions` : 'All played · Start over') : 'Pick a category') : 'Pick who is playing'}
        </button>
        <div className="row small">
          <button className="link" onClick={onLiked}>
            👍 Liked questions ({likedCount})
          </button>
          <button
            className="link muted"
            onClick={() => {
              if (confirm('Reset all likes and preferences?')) onReset()
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </main>
  )
}
