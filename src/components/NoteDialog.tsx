import { useEffect, useRef, useState } from 'react'
import { CATEGORY_BY_ID } from '../data/categories'
import type { Question } from '../types'

interface Props {
  question: Question
  initial: string
  onSave: (text: string) => void
  onClose: () => void
}

export function NoteDialog({ question, initial, onSave, onClose }: Props) {
  const [text, setText] = useState(initial)
  const [closing, setClosing] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const cat = CATEGORY_BY_ID[question.category]

  useEffect(() => {
    const t = window.setTimeout(() => areaRef.current?.focus(), 250)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const close = (after?: () => void) => {
    setClosing(true)
    window.setTimeout(() => {
      after?.()
      onClose()
    }, 200)
  }

  return (
    <div className={`sheet-backdrop ${closing ? 'closing' : ''}`} onClick={() => close()}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" aria-hidden />
        <div className="sheet-head">
          <h2 id="note-title">✎ Note</h2>
          <span className="sheet-cat" style={{ background: `linear-gradient(135deg, ${cat.colors[0]}, ${cat.colors[1]})` }}>
            {cat.emoji} {cat.label}
          </span>
        </div>
        <p className="sheet-question">{question.text}</p>
        <textarea
          ref={areaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you both answer? Anything you want to remember…"
          rows={5}
          maxLength={2000}
        />
        <div className="sheet-actions">
          {initial && (
            <button className="link muted" onClick={() => close(() => onSave(''))}>
              Delete
            </button>
          )}
          <span className="spacer" />
          <button className="ghost" onClick={() => close()}>
            Cancel
          </button>
          <button className="save" onClick={() => close(() => onSave(text.trim()))}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
