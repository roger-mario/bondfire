import { useCallback, useState } from 'react'
import { NoteDialog } from '../components/NoteDialog'
import { QuestionCard, TopBar } from '../components/QuestionCard'
import { dateKey, type Streak } from '../lib/daily'
import type { DailyMap, NotesMap, PartnerData } from '../lib/storage'
import type { Question } from '../types'

interface Props {
  question: Question
  daily: DailyMap
  streak: Streak
  notes: NotesMap
  setNote: (id: string, text: string) => void
  onAnswered: () => void
  partner: PartnerData | null
  onBack: () => void
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function Daily({ question, daily, streak, notes, setNote, onAnswered, partner, onBack }: Props) {
  const [noteOpen, setNoteOpen] = useState(false)
  const closeNote = useCallback(() => setNoteOpen(false), [])
  const [justAnswered, setJustAnswered] = useState(false)

  // The last seven days, oldest first.
  const today = new Date()
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + i)
    return { key: dateKey(d), label: WEEKDAYS[d.getDay()], isToday: i === 6 }
  })

  const answer = () => {
    onAnswered()
    setJustAnswered(true)
    navigator.vibrate?.([10, 40, 10])
  }

  const partnerNote = partner?.notes[question.id]

  return (
    <main className="screen daily">
      <TopBar title="Question of the day" onBack={onBack} />

      <div className={`streak-pill ${streak.current > 0 ? 'on' : ''} ${justAnswered ? 'pop' : ''}`}>
        <span className="streak-flame">🔥</span>
        <span>
          <strong>{streak.current}</strong> {streak.current === 1 ? 'day' : 'days'} in a row
        </span>
        {streak.best > streak.current && <small>best {streak.best}</small>}
      </div>

      <div className="week">
        {week.map((d) => (
          <span key={d.key} className={`week-day ${daily[d.key] ? 'done' : ''} ${d.isToday ? 'today' : ''}`}>
            <span className="week-dot">{daily[d.key] ? '🔥' : ''}</span>
            {d.label}
          </span>
        ))}
      </div>

      <QuestionCard question={question} label="☀️ Today">
        {notes[question.id] && <p className="qcard-note">✎ {notes[question.id].text}</p>}
        {partnerNote && (
          <p className="qcard-note">
            💬 {partner!.name}: {partnerNote.text}
          </p>
        )}
      </QuestionCard>

      <div className="stack">
        {streak.answeredToday ? (
          <div className="done-banner">
            {justAnswered ? '🎉 Nice! See you tomorrow for a new one.' : '✓ Answered today. A new question comes tomorrow.'}
          </div>
        ) : (
          <button className="primary" onClick={answer}>
            ✓ We talked about it
          </button>
        )}
        <button className="ghost wide" onClick={() => setNoteOpen(true)}>
          ✎ {notes[question.id] ? 'Edit your note' : 'Write down your answers'}
        </button>
        {partner && (
          <p className="hint">
            {partner.name} is on a {partner.streak}-day streak. You get the same question each day when you pick the same mode.
          </p>
        )}
      </div>

      {noteOpen && (
        <NoteDialog
          question={question}
          initial={notes[question.id]?.text ?? ''}
          onSave={(text) => setNote(question.id, text)}
          onClose={closeNote}
        />
      )}
    </main>
  )
}
