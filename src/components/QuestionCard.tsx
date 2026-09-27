import type { ReactNode } from 'react'
import { CATEGORY_BY_ID } from '../data/categories'
import type { Question } from '../types'

interface Props {
  question: Question
  /** Replaces the category chip text */
  label?: string
  children?: ReactNode
}

/** Non-swipeable question card for the daily question, journeys and games. */
export function QuestionCard({ question, label, children }: Props) {
  const cat = CATEGORY_BY_ID[question.category]
  return (
    <div className="qcard" style={{ background: `linear-gradient(150deg, ${cat.colors[0]}, ${cat.colors[1]})` }}>
      <span className="chip">{label ?? `${cat.emoji} ${cat.label}`}</span>
      <p className="card-text">{question.text}</p>
      {children}
    </div>
  )
}

export function TopBar({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="topbar">
      <button className="icon" onClick={onBack} aria-label="Back">
        ‹
      </button>
      <span className="counter">{title}</span>
      {right ?? <span className="icon" />}
    </header>
  )
}
