import type { Screen } from '../App'
import type { Streak } from '../lib/daily'
import type { PairState } from '../lib/storage'
import type { Question } from '../types'

export function DailyBanner({ question, streak, onOpen }: { question: Question; streak: Streak; onOpen: () => void }) {
  return (
    <button className={`daily-banner ${streak.answeredToday ? 'answered' : ''}`} onClick={onOpen}>
      <span className="daily-top">
        <span>☀️ Question of the day</span>
        <span className={`daily-streak ${streak.current ? 'on' : ''}`}>🔥 {streak.current}</span>
      </span>
      <span className="daily-q">{question.text}</span>
      <span className="daily-cta">{streak.answeredToday ? '✓ Answered today' : 'Answer it together ›'}</span>
    </button>
  )
}

interface MoreProps {
  pair: PairState | null
  newMatches: number
  onOpen: (s: Screen) => void
}

export function MoreWays({ pair, newMatches, onOpen }: MoreProps) {
  const pairSub = pair ? (pair.partner ? `With ${pair.partner.name}` : `Code ${pair.code}`) : 'Swipe together'
  const tiles: { screen: Screen; emoji: string; label: string; sub: string; badge?: number }[] = [
    { screen: 'pair', emoji: '📲', label: 'Pair phones', sub: pairSub, badge: newMatches },
    { screen: 'journeys', emoji: '🧭', label: 'Journeys', sub: 'Light to deep' },
    { screen: 'guess', emoji: '🤔', label: 'Guess my answer', sub: 'How well do you know me?' },
    { screen: 'party', emoji: '🎉', label: 'Party mode', sub: 'Timed, for groups' },
    { screen: 'memory', emoji: '📖', label: 'Memory book', sub: 'Look back together' },
  ]
  return (
    <section>
      <h2>More ways to bond</h2>
      <div className="more">
        {tiles.map((t) => (
          <button key={t.screen} className="more-tile" onClick={() => onOpen(t.screen)}>
            <span className="more-emoji">{t.emoji}</span>
            <span className="cat-text">
              <span className="cat-label">{t.label}</span>
              <span className="cat-blurb">{t.sub}</span>
            </span>
            {!!t.badge && <span className="badge">{t.badge}</span>}
          </button>
        ))}
      </div>
    </section>
  )
}
