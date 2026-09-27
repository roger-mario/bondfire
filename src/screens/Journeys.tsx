import { useCallback, useState } from 'react'
import { NoteDialog } from '../components/NoteDialog'
import { QuestionCard, TopBar } from '../components/QuestionCard'
import { CATEGORY_BY_ID } from '../data/categories'
import { JOURNEYS, type Journey } from '../data/journeys'
import type { JourneyProgress, NotesMap } from '../lib/storage'
import type { Mode } from '../types'

interface Props {
  mode: Mode | null
  progress: JourneyProgress
  onPartDone: (journey: Journey, partIndex: number) => void
  notes: NotesMap
  setNote: (id: string, text: string) => void
  onBack: () => void
}

type View = { journey: null } | { journey: Journey; part: null } | { journey: Journey; part: number; index: number; finished: boolean }

export function Journeys({ mode, progress, onPartDone, notes, setNote, onBack }: Props) {
  const [view, setView] = useState<View>({ journey: null })
  const [noteOpen, setNoteOpen] = useState(false)
  const closeNote = useCallback(() => setNoteOpen(false), [])

  const list = JOURNEYS.filter((j) => !mode || j.mode === 'both' || j.mode === mode)
  const doneParts = (j: Journey) => progress[j.id]?.done ?? []

  if (!view.journey) {
    return (
      <main className="screen journeys">
        <TopBar title="Journeys" onBack={onBack} />
        <p className="lead">Guided sets that start light and go deeper. Play one part per sitting.</p>
        <div className="journey-list">
          {list.map((j) => {
            const done = doneParts(j).length
            const [from, to] = CATEGORY_BY_ID[j.categories[2]].colors
            return (
              <button key={j.id} className="journey-tile" onClick={() => setView({ journey: j, part: null })}>
                <span className="journey-emoji" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                  {j.emoji}
                </span>
                <span className="journey-text">
                  <span className="journey-title">{j.title}</span>
                  <span className="journey-blurb">{j.blurb}</span>
                  <span className="bar">
                    <span style={{ width: `${(done / j.parts.length) * 100}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
                  </span>
                  <span className="journey-progress">
                    {done === j.parts.length ? '✓ Completed' : `${done} of ${j.parts.length} parts done`}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </main>
    )
  }

  const journey = view.journey
  const done = doneParts(journey)

  if (view.part === null) {
    return (
      <main className="screen journeys">
        <TopBar title={journey.title} onBack={() => setView({ journey: null })} />
        <div className="journey-hero">
          <span className="journey-hero-emoji">{journey.emoji}</span>
          <p>{journey.blurb}</p>
        </div>
        <ol className="parts">
          {journey.parts.map((p, i) => {
            const isDone = done.includes(i)
            const unlocked = i === 0 || done.includes(i - 1)
            const cat = CATEGORY_BY_ID[journey.categories[i]]
            return (
              <li key={i} className={`part ${isDone ? 'done' : ''} ${unlocked ? '' : 'locked'}`}>
                <span className="part-num" style={{ background: `linear-gradient(135deg, ${cat.colors[0]}, ${cat.colors[1]})` }}>
                  {isDone ? '✓' : i + 1}
                </span>
                <span className="part-text">
                  <span className="part-title">{p.title}</span>
                  <span className="part-sub">
                    {p.questions.length} questions · {['Light', 'Medium', 'Deep'][Math.min(i, 2)]}
                  </span>
                </span>
                <button
                  className={isDone || !unlocked ? 'ghost' : 'save'}
                  disabled={!unlocked}
                  onClick={() => setView({ journey, part: i, index: 0, finished: false })}
                >
                  {!unlocked ? '🔒' : isDone ? 'Replay' : 'Start'}
                </button>
              </li>
            )
          })}
        </ol>
        {done.length === journey.parts.length && <p className="done-banner">🎉 You finished this journey together.</p>}
      </main>
    )
  }

  const part = journey.parts[view.part]
  const q = part.questions[view.index]
  const last = view.index === part.questions.length - 1

  if (view.finished) {
    return (
      <main className="screen journeys">
        <TopBar title={journey.title} onBack={() => setView({ journey, part: null })} />
        <div className="finish">
          <div className="empty-emoji">🎉</div>
          <h2>{part.title} done</h2>
          <p>
            {view.part < journey.parts.length - 1
              ? `Next up: ${journey.parts[view.part + 1].title}. Save it for another day, or keep going now.`
              : 'That was the last part. You made it all the way through.'}
          </p>
          <button className="primary" onClick={() => setView({ journey, part: null })}>
            Back to the journey
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="screen journeys journey-play">
      <TopBar title={`${part.title} · ${view.index + 1}/${part.questions.length}`} onBack={() => setView({ journey, part: null })} />
      <div className="dots">
        {part.questions.map((_, i) => (
          <span key={i} className={i <= view.index ? 'on' : ''} />
        ))}
      </div>
      <QuestionCard key={q.id} question={q} label={`${journey.emoji} ${journey.title}`}>
        {notes[q.id] && <p className="qcard-note">✎ {notes[q.id].text}</p>}
      </QuestionCard>
      <div className="step-actions">
        <button className="ghost" disabled={view.index === 0} onClick={() => setView({ ...view, index: view.index - 1 })}>
          ‹ Back
        </button>
        <button className={`ghost ${notes[q.id] ? 'has-note-btn' : ''}`} onClick={() => setNoteOpen(true)} aria-label="Note">
          ✎
        </button>
        <button
          className="save grow"
          onClick={() => {
            if (!last) return setView({ ...view, index: view.index + 1 })
            onPartDone(journey, view.part)
            setView({ ...view, finished: true })
          }}
        >
          {last ? 'Finish part ✓' : 'Next ›'}
        </button>
      </div>
      {noteOpen && <NoteDialog question={q} initial={notes[q.id]?.text ?? ''} onSave={(t) => setNote(q.id, t)} onClose={closeNote} />}
    </main>
  )
}
