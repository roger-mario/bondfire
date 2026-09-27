import { useImperativeHandle, useRef, useState, type Ref } from 'react'
import { CATEGORY_BY_ID } from '../data/categories'
import type { Question } from '../types'

export type SwipeDir = 'left' | 'right' | 'up'

export interface SwipeCardHandle {
  swipe: (dir: SwipeDir) => void
}

interface Props {
  question: Question
  onSwiped: (dir: SwipeDir) => void
  onUndo: () => void
  canUndo: boolean
  onNote: () => void
  hasNote: boolean
  ref?: Ref<SwipeCardHandle>
}

const X_THRESHOLD = 90
const Y_THRESHOLD = 110
const EXIT_MS = 280

export function SwipeCard({ question, onSwiped, onUndo, canUndo, onNote, hasNote, ref }: Props) {
  const cat = CATEGORY_BY_ID[question.category]
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [exiting, setExiting] = useState<SwipeDir | null>(null)
  const start = useRef<{ x: number; y: number; t: number } | null>(null)

  const exit = (dir: SwipeDir) => {
    if (exiting) return
    setExiting(dir)
    setDragging(false)
    const w = window.innerWidth
    setOffset(dir === 'up' ? { x: 0, y: -window.innerHeight } : { x: dir === 'right' ? w * 1.4 : -w * 1.4, y: offset.y + 40 })
    navigator.vibrate?.(8)
    window.setTimeout(() => onSwiped(dir), EXIT_MS)
  }

  useImperativeHandle(ref, () => ({ swipe: exit }))

  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    setDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current || exiting) return
    setOffset({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!start.current || exiting) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    const dt = Math.max(1, performance.now() - start.current.t)
    const vx = dx / dt
    start.current = null
    // A quick flick counts even if it didn't travel far.
    if (dx > X_THRESHOLD || (vx > 0.6 && dx > 30)) return exit('right')
    if (dx < -X_THRESHOLD || (vx < -0.6 && dx < -30)) return exit('left')
    if (dy < -Y_THRESHOLD && Math.abs(dx) < X_THRESHOLD) return exit('up')
    setDragging(false)
    setOffset({ x: 0, y: 0 })
  }

  const rotate = offset.x / 18
  // Swipe left = thumbs up, swipe right = thumbs down.
  const like = Math.min(1, Math.max(0, -offset.x / X_THRESHOLD))
  const nope = Math.min(1, Math.max(0, offset.x / X_THRESHOLD))
  const skip = Math.min(1, Math.max(0, -offset.y / Y_THRESHOLD)) * (1 - Math.max(like, nope))

  // Tapping a hint counts as a swipe; stop the card from starting a drag.
  const press = (fn: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onClick: fn,
  })
  const tap = (dir: SwipeDir) => press(() => exit(dir))
  const fade = 1 - Math.max(like, nope, skip) * 0.8

  return (
    <div
      className="card"
      style={{
        background: `linear-gradient(150deg, ${cat.colors[0]}, ${cat.colors[1]})`,
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotate}deg)`,
        transition: dragging ? 'none' : `transform ${EXIT_MS}ms ease-out`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="chip">
        {cat.emoji} {cat.label}
      </span>
      <p className="card-text">{question.text}</p>

      <div className="tint tint-like" style={{ opacity: like * 0.35 }} />
      <div className="tint tint-nope" style={{ opacity: nope * 0.35 }} />
      <div className="stamp stamp-like" style={{ opacity: like }}>👍 Like</div>
      <div className="stamp stamp-nope" style={{ opacity: nope }}>👎 Pass</div>
      <div className="stamp stamp-skip" style={{ opacity: skip }}>Skip</div>

      <div className="card-actions">
        <button
          className="vote"
          aria-label="Thumbs up"
          style={{ opacity: 0.75 + like * 0.25 - nope * 0.45, transform: `scale(${1 + like * 0.35})` }}
          {...tap('left')}
        >
          👍
        </button>
        <div className="mid-actions" style={{ opacity: fade }}>
          <button className="mini" aria-label="Undo last card" disabled={!canUndo} {...press(onUndo)}>
            ↺
          </button>
          <button className="mini skip-btn" aria-label="Skip" {...tap('up')}>
            ↑
            <small>skip</small>
          </button>
          <button className={`mini ${hasNote ? 'has-note' : ''}`} aria-label={hasNote ? 'Edit note' : 'Add note'} {...press(onNote)}>
            ✎
          </button>
        </div>
        <button
          className="vote"
          aria-label="Thumbs down"
          style={{ opacity: 0.75 + nope * 0.25 - like * 0.45, transform: `scale(${1 + nope * 0.35})` }}
          {...tap('right')}
        >
          👎
        </button>
      </div>
    </div>
  )
}

/** Static card shown underneath the active one. */
export function PeekCard({ question }: { question: Question }) {
  const cat = CATEGORY_BY_ID[question.category]
  return (
    <div
      className="card card-peek"
      aria-hidden
      style={{ background: `linear-gradient(150deg, ${cat.colors[0]}, ${cat.colors[1]})` }}
    >
      <span className="chip">
        {cat.emoji} {cat.label}
      </span>
    </div>
  )
}
