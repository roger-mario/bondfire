import { useEffect } from 'react'
import type { Question } from '../types'

interface Props {
  question: Question
  partner: string
  onDone: () => void
}

/** "You matched" moment when you like a question your partner liked too. */
export function MatchToast({ question, partner, onDone }: Props) {
  useEffect(() => {
    navigator.vibrate?.([20, 60, 20, 60, 40])
    const t = window.setTimeout(onDone, 3200)
    return () => window.clearTimeout(t)
  }, [onDone])

  return (
    <div className="match" role="status" onClick={onDone}>
      <div className="match-card">
        <div className="match-hearts" aria-hidden>
          <span>💞</span>
        </div>
        <strong>You matched!</strong>
        <span>{partner} liked this one too</span>
        <p>{question.text}</p>
      </div>
    </div>
  )
}
