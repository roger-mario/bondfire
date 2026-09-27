import { useEffect, useRef, useState } from 'react'
import { QuestionCard, TopBar } from '../components/QuestionCard'
import { fitsMode } from '../lib/recommend'
import type { LogEntry } from '../lib/storage'
import type { Question } from '../types'

interface Props {
  questions: Question[]
  defaultPlayers: string[]
  onFinish: (entry: Omit<LogEntry, 'id' | 'at'>, players: string[]) => void
  onBack: () => void
}

const TIMES = [30, 60, 90]

/** Light and medium friend questions for a group, a random player per turn, against the clock. */
export function Party({ questions, defaultPlayers, onFinish, onBack }: Props) {
  const [players, setPlayers] = useState<string[]>(defaultPlayers.length ? defaultPlayers : ['', '', ''])
  const [seconds, setSeconds] = useState(60)
  const [playing, setPlaying] = useState(false)
  const [turn, setTurn] = useState<{ player: string; question: Question } | null>(null)
  const [left, setLeft] = useState(0)
  const [answered, setAnswered] = useState(0)
  const used = useRef(new Set<string>())
  const lastPlayer = useRef('')

  const names = players.map((p) => p.trim()).filter(Boolean)

  const pool = questions.filter((q) => fitsMode(q, 'friends') && q.depth <= 2)

  const nextTurn = () => {
    let options = pool.filter((q) => !used.current.has(q.id))
    if (options.length === 0) {
      used.current.clear()
      options = pool
    }
    const question = options[Math.floor(Math.random() * options.length)]
    used.current.add(question.id)
    const others = names.length > 1 ? names.filter((n) => n !== lastPlayer.current) : names
    const player = others[Math.floor(Math.random() * others.length)]
    lastPlayer.current = player
    setTurn({ player, question })
    setLeft(seconds)
  }

  useEffect(() => {
    if (!playing || left <= 0) return
    const t = window.setTimeout(() => {
      setLeft((l) => l - 1)
      if (left === 1) navigator.vibrate?.([80, 60, 80])
    }, 1000)
    return () => window.clearTimeout(t)
  }, [playing, left])

  const start = () => {
    setPlayers(names)
    setAnswered(0)
    used.current.clear()
    setPlaying(true)
    nextTurn()
  }

  const end = () => {
    if (answered > 0) {
      onFinish({ kind: 'party', title: `Party mode with ${names.join(', ')}`, text: `${answered} ${answered === 1 ? 'question' : 'questions'} answered` }, names)
    }
    setPlaying(false)
    setTurn(null)
  }

  if (!playing || !turn) {
    return (
      <main className="screen game">
        <TopBar title="Party mode" onBack={onBack} />
        <div className="game-intro">
          <div className="empty-emoji">🎉</div>
          <p>A random player gets a question and has to answer before the timer runs out. Then pass it on.</p>
        </div>
        <h2>Players</h2>
        <div className="players">
          {players.map((p, i) => (
            <div key={i} className="player-row">
              <input
                value={p}
                maxLength={20}
                placeholder={`Player ${i + 1}`}
                onChange={(e) => setPlayers(players.map((x, j) => (j === i ? e.target.value : x)))}
              />
              {players.length > 2 && (
                <button className="icon small" aria-label="Remove player" onClick={() => setPlayers(players.filter((_, j) => j !== i))}>
                  ×
                </button>
              )}
            </div>
          ))}
          {players.length < 12 && (
            <button className="link" onClick={() => setPlayers([...players, ''])}>
              + Add player
            </button>
          )}
        </div>
        <h2>Time per question</h2>
        <div className="seg" role="group" aria-label="Time per question">
          {TIMES.map((t) => (
            <button key={t} className={seconds === t ? 'active' : ''} onClick={() => setSeconds(t)}>
              {t}s
            </button>
          ))}
        </div>
        <div className="bottom">
          <button className="primary" disabled={names.length < 2} onClick={start}>
            {names.length < 2 ? 'Add at least 2 players' : 'Start the party'}
          </button>
        </div>
      </main>
    )
  }

  const pct = (left / seconds) * 100
  return (
    <main className="screen game party-play">
      <TopBar title={`${answered} answered`} onBack={end} right={<button className="link" onClick={end}>End</button>} />
      <div className="turn-name" key={turn.player + turn.question.id}>
        <span>{turn.player}</span>, you're up!
      </div>
      <div className={`timer ${left <= 5 ? 'low' : ''}`}>
        <span style={{ width: `${pct}%` }} />
        <strong>{left > 0 ? `${left}s` : "Time's up!"}</strong>
      </div>
      <QuestionCard key={turn.question.id} question={turn.question} />
      <div className="step-actions">
        <button className="ghost grow" onClick={nextTurn}>
          Skip
        </button>
        <button
          className="save grow"
          onClick={() => {
            setAnswered((a) => a + 1)
            nextTurn()
          }}
        >
          Answered ✓
        </button>
      </div>
    </main>
  )
}
