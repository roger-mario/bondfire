import { useMemo, type CSSProperties } from 'react'
import type { BurstKind } from '../lib/burst'

const CONFETTI_COLORS = ['#ff6a3d', '#ffb347', '#34c77b', '#4568dc', '#f953c6', '#6dd5ed', '#fff']
const FLOAT_EMOJI = ['😍', '🥰', '💖', '🔥', '👍', '✨', '💞']
const HEARTS = ['❤️', '💖', '💗', '💕', '🧡']

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pickOne = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

interface Particle {
  content: string
  style: CSSProperties
}

function makeParticles(kind: BurstKind): Particle[] {
  switch (kind) {
    case 'hearts':
      return Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2 + rand(-0.2, 0.2)
        const dist = rand(110, 190)
        return {
          content: pickOne(HEARTS),
          style: {
            '--dx': `${Math.cos(angle) * dist}px`,
            '--dy': `${Math.sin(angle) * dist}px`,
            '--s': rand(0.8, 1.5).toFixed(2),
            animationDelay: `${rand(0, 80)}ms`,
          } as CSSProperties,
        }
      })
    case 'confetti':
      return Array.from({ length: 36 }, () => ({
        content: '',
        style: {
          left: `${rand(0, 100)}%`,
          background: pickOne(CONFETTI_COLORS),
          '--r': `${rand(-540, 540)}deg`,
          '--drift': `${rand(-60, 60)}px`,
          width: `${rand(6, 10)}px`,
          height: `${rand(10, 16)}px`,
          animationDuration: `${rand(900, 1300)}ms`,
          animationDelay: `${rand(0, 200)}ms`,
        } as CSSProperties,
      }))
    case 'sparkles':
      return Array.from({ length: 16 }, () => ({
        content: pickOne(['✨', '⭐', '🌟']),
        style: {
          left: `${rand(10, 90)}%`,
          top: `${rand(15, 80)}%`,
          '--s': rand(0.7, 1.6).toFixed(2),
          animationDelay: `${rand(0, 350)}ms`,
        } as CSSProperties,
      }))
    case 'float':
      return Array.from({ length: 12 }, () => ({
        content: pickOne(FLOAT_EMOJI),
        style: {
          left: `${rand(5, 90)}%`,
          '--drift': `${rand(-40, 40)}px`,
          '--s': rand(0.9, 1.6).toFixed(2),
          animationDuration: `${rand(900, 1300)}ms`,
          animationDelay: `${rand(0, 250)}ms`,
        } as CSSProperties,
      }))
    case 'pulse':
      return [{ content: '👍', style: {} }]
  }
}

export function LikeBurst({ kind }: { kind: BurstKind }) {
  const particles = useMemo(() => makeParticles(kind), [kind])
  return (
    <div className={`burst burst-${kind}`} aria-hidden>
      {kind === 'pulse' && (
        <>
          <span className="ring" />
          <span className="ring ring-2" />
        </>
      )}
      {particles.map((p, i) => (
        <span key={i} className="p" style={p.style}>
          {p.content}
        </span>
      ))}
    </div>
  )
}
