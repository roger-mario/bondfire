import { useState } from 'react'
import { TopBar } from '../components/QuestionCard'
import { CATEGORY_BY_ID } from '../data/categories'
import type { DailyMap, LogEntry, NotesMap, PartnerData } from '../lib/storage'
import type { Question } from '../types'

interface Props {
  questionById: Map<string, Question>
  notes: NotesMap
  daily: DailyMap
  log: LogEntry[]
  partner: PartnerData | null
  addMemory: (title: string, text: string) => void
  removeLog: (id: string) => void
  onBack: () => void
}

interface Entry {
  key: string
  at: number
  icon: string
  title: string
  question?: Question
  text?: string
  /** Written on the partner's phone */
  theirs?: boolean
  rounds?: LogEntry['rounds']
  logId?: string
}

const ICONS: Record<LogEntry['kind'], string> = { journey: '🧭', guess: '🤔', party: '🎉', memory: '📸' }

const monthLabel = (at: number) => new Date(at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
const dayLabel = (at: number) => new Date(at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

/** A timeline of everything you wrote down and did together, newest first. */
export function Memory({ questionById, notes, daily, log, partner, addMemory, removeLog, onBack }: Props) {
  const [writing, setWriting] = useState(false)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  const entries: Entry[] = []
  const dailyIds = new Set(Object.values(daily).map((d) => d.questionId))

  for (const [date, d] of Object.entries(daily)) {
    const question = questionById.get(d.questionId)
    entries.push({
      key: `daily-${date}`,
      at: d.answeredAt,
      icon: '☀️',
      title: 'Question of the day',
      question,
      text: notes[d.questionId]?.text,
    })
  }
  for (const [id, note] of Object.entries(notes)) {
    if (dailyIds.has(id)) continue
    entries.push({ key: `note-${id}`, at: note.updatedAt, icon: '✎', title: 'Note', question: questionById.get(id), text: note.text })
  }
  for (const l of log) {
    entries.push({ key: l.id, at: l.at, icon: ICONS[l.kind], title: l.title, text: l.text, rounds: l.rounds, logId: l.id })
  }
  if (partner) {
    for (const [id, note] of Object.entries(partner.notes)) {
      entries.push({
        key: `p-note-${id}`,
        at: note.updatedAt,
        icon: '💬',
        title: `${partner.name}'s note`,
        question: questionById.get(id),
        text: note.text,
        theirs: true,
      })
    }
    for (const l of partner.log) {
      entries.push({
        key: `p-${l.id}`,
        at: l.at,
        icon: ICONS[l.kind],
        title: l.kind === 'memory' ? `${partner.name}: ${l.title}` : l.title,
        text: l.text,
        rounds: l.rounds,
        theirs: true,
      })
    }
  }

  entries.sort((a, b) => b.at - a.at)

  const groups: { month: string; items: Entry[] }[] = []
  for (const e of entries) {
    const month = monthLabel(e.at)
    if (groups.at(-1)?.month !== month) groups.push({ month, items: [] })
    groups.at(-1)!.items.push(e)
  }

  const save = () => {
    if (!text.trim()) return
    addMemory(title.trim() || 'A memory', text.trim())
    setTitle('')
    setText('')
    setWriting(false)
  }

  return (
    <main className="screen memory">
      <TopBar title="Memory book" onBack={onBack} />

      {writing ? (
        <div className="memory-form">
          <input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Title, like “Our first trip”" />
          <textarea value={text} rows={4} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder="What happened? What do you want to remember?" autoFocus />
          <div className="sheet-actions">
            <span className="spacer" />
            <button className="ghost" onClick={() => setWriting(false)}>
              Cancel
            </button>
            <button className="save" disabled={!text.trim()} onClick={save}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <button className="ghost wide" onClick={() => setWriting(true)}>
          + Write a memory
        </button>
      )}

      {entries.length === 0 && (
        <p className="empty-text">
          Your notes, daily questions, finished journeys and games show up here, so you can look back on them together.
        </p>
      )}

      {groups.map((g) => (
        <section key={g.month} className="timeline">
          <h2>{g.month}</h2>
          <ol>
            {g.items.map((e) => {
              const cat = e.question ? CATEGORY_BY_ID[e.question.category] : null
              return (
                <li key={e.key} className={e.theirs ? 'theirs' : ''}>
                  <span className="tl-icon" style={cat ? { background: `linear-gradient(135deg, ${cat.colors[0]}, ${cat.colors[1]})` } : undefined}>
                    {e.icon}
                  </span>
                  <div className="tl-body">
                    <div className="tl-head">
                      <span>{e.title}</span>
                      <time>{dayLabel(e.at)}</time>
                    </div>
                    {e.question && <p className="tl-question">{e.question.text}</p>}
                    {e.text && <p className="tl-text">{e.text}</p>}
                    {e.rounds && (
                      <details>
                        <summary>See the answers</summary>
                        <ul>
                          {e.rounds.map((r, i) => (
                            <li key={i}>
                              {r.question} {r.answerer}: <strong>{r.answer}</strong>, guess: <strong>{r.guess}</strong> {r.correct ? '✅' : '❌'}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {e.logId && (
                      <button
                        className="link muted tl-remove"
                        onClick={() => {
                          if (confirm('Remove this from the memory book?')) removeLog(e.logId!)
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </main>
  )
}
