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
  ref?: Ref<SwipeCardHandle>
}

const X_THRESHOLD = 90
const Y_THRESHOLD = 110
const EXIT_MS = 280

export function SwipeCard({ question, onSwiped, ref }: Props) {
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
  const likeOpacity = Math.min(1, Math.max(0, -offset.x / X_THRESHOLD))
  const nopeOpacity = Math.min(1, Math.max(0, offset.x / X_THRESHOLD))
  const skipOpacity = Math.min(1, Math.max(0, -offset.y / Y_THRESHOLD)) * (1 - Math.max(likeOpacity, nopeOpacity))

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
      <div className="card-top">
        <span className="chip">
          {cat.emoji} {cat.label}
        </span>
        <span className="depth" aria-label={`Depth ${question.depth} of 3`}>
          {[1, 2, 3].map((d) => (
            <i key={d} className={d <= question.depth ? 'on' : ''} />
          ))}
        </span>
      </div>
      <p className="card-text">{question.text}</p>
      <div className="card-hint">Take turns answering</div>

      <div className="stamp stamp-like" style={{ opacity: likeOpacity }}>👍 Like</div>
      <div className="stamp stamp-nope" style={{ opacity: nopeOpacity }}>👎 Pass</div>
      <div className="stamp stamp-skip" style={{ opacity: skipOpacity }}>Skip</div>
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
      <div className="card-top">
        <span className="chip">
          {cat.emoji} {cat.label}
        </span>
      </div>
    </div>
  )
}
