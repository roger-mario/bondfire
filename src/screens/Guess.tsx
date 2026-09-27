import { useState } from 'react'
import { QuestionCard, TopBar } from '../components/QuestionCard'
import { GUESS_QUESTIONS } from '../data/guess'
import type { LogEntry } from '../lib/storage'
import type { Question } from '../types'

interface Props {
  defaultNames: [string, string]
  onFinish: (entry: Omit<LogEntry, 'id' | 'at'>, names: [string, string]) => void
  onBack: () => void
}

type Round = NonNullable<LogEntry['rounds']>[number]
type Phase = 'setup' | 'hand-answer' | 'answer' | 'hand-guess' | 'guess' | 'reveal' | 'results'

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const asQuestion = (text: string, i: number): Question => ({
  id: `guess-${i}`,
  text,
  category: i % 2 ? 'fun' : 'warmup',
  mode: 'both',
  depth: 1,
})

/** Pass-the-phone game: one answers in secret, the other guesses, then compare. */
export function Guess({ defaultNames, onFinish, onBack }: Props) {
  const [names, setNames] = useState<[string, string]>(defaultNames)
  const [total, setTotal] = useState(6)
  const [phase, setPhase] = useState<Phase>('setup')
  const [deck, setDeck] = useState<string[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [answer, setAnswer] = useState('')
  const [guess, setGuess] = useState('')

  const n = rounds.length
  const answerer = names[n % 2]
  const guesser = names[(n + 1) % 2]
  const text = deck[n] ?? ''
  const score = (who: string) => rounds.filter((r) => r.answerer !== who && r.correct).length

  const start = () => {
    const clean: [string, string] = [names[0].trim() || 'Player 1', names[1].trim() || 'Player 2']
    setNames(clean)
    setDeck(shuffled(GUESS_QUESTIONS).slice(0, total))
    setRounds([])
    setPhase('hand-answer')
  }

  const judge = (correct: boolean) => {
    const next = [...rounds, { question: text, answerer, answer: answer.trim(), guess: guess.trim(), correct }]
    setRounds(next)
    setAnswer('')
    setGuess('')
    if (next.length >= total) {
      const [a, b] = names
      const sa = next.filter((r) => r.answerer === b && r.correct).length
      const sb = next.filter((r) => r.answerer === a && r.correct).length
      onFinish({ kind: 'guess', title: `Guess my answer: ${a} ${sa}, ${b} ${sb}`, rounds: next }, names)
      setPhase('results')
    } else {
      setPhase('hand-answer')
    }
  }

  if (phase === 'setup') {
    return (
      <main className="screen game">
        <TopBar title="Guess my answer" onBack={onBack} />
        <div className="game-intro">
          <div className="empty-emoji">🤔</div>
          <p>
            One of you answers a question in secret. The other guesses what they said. Then you compare. Pass the phone
            back and forth.
          </p>
        </div>
        <label className="field">
          <span>Player 1</span>
          <input value={names[0]} maxLength={20} onChange={(e) => setNames([e.target.value, names[1]])} placeholder="Name" />
        </label>
        <label className="field">
          <span>Player 2</span>
          <input value={names[1]} maxLength={20} onChange={(e) => setNames([names[0], e.target.value])} placeholder="Name" />
        </label>
        <div className="seg" role="group" aria-label="Rounds">
          {[4, 6, 10].map((r) => (
            <button key={r} className={total === r ? 'active' : ''} onClick={() => setTotal(r)}>
              {r} rounds
            </button>
          ))}
        </div>
        <div className="bottom">
          <button className="primary" onClick={start}>
            Start
          </button>
        </div>
      </main>
    )
  }

  if (phase === 'results') {
    const [a, b] = names
    const sa = score(a)
    const sb = score(b)
    return (
      <main className="screen game">
        <TopBar title="Results" onBack={onBack} />
        <div className="scoreboard">
          <div className={sa >= sb ? 'win' : ''}>
            <span>{a}</span>
            <strong>{sa}</strong>
          </div>
          <div className={sb >= sa ? 'win' : ''}>
            <span>{b}</span>
            <strong>{sb}</strong>
          </div>
        </div>
        <p className="lead center">
          {sa === sb ? "It's a tie. You know each other equally well! 💞" : `${sa > sb ? a : b} knows the other best! 🏆`}
        </p>
        <ul className="round-list">
          {rounds.map((r, i) => (
            <li key={i}>
              <p className="round-q">{r.question}</p>
              <p>
                {r.answerer}: <strong>{r.answer || '…'}</strong>
              </p>
              <p>
                Guess: <strong>{r.guess || '…'}</strong> {r.correct ? '✅' : '❌'}
              </p>
            </li>
          ))}
        </ul>
        <p className="hint center">Saved to your memory book.</p>
        <div className="bottom">
          <button className="primary" onClick={start}>
            Play again
          </button>
        </div>
      </main>
    )
  }

  const question = asQuestion(text, n)
  const title = `Round ${n + 1} of ${total}`

  if (phase === 'hand-answer' || phase === 'hand-guess') {
    const to = phase === 'hand-answer' ? answerer : guesser
    const other = phase === 'hand-answer' ? guesser : answerer
    return (
      <main className="screen game">
        <TopBar title={title} onBack={onBack} />
        <div className="handoff">
          <div className="handoff-emoji">📱</div>
          <h2>Pass the phone to {to}</h2>
          <p>{phase === 'hand-answer' ? `${other}, no peeking!` : `${other} has locked in an answer.`}</p>
          <button className="primary" onClick={() => setPhase(phase === 'hand-answer' ? 'answer' : 'guess')}>
            I'm {to}
          </button>
        </div>
      </main>
    )
  }

  if (phase === 'answer' || phase === 'guess') {
    const isAnswer = phase === 'answer'
    const value = isAnswer ? answer : guess
    const submit = () => value.trim() && setPhase(isAnswer ? 'hand-guess' : 'reveal')
    return (
      <main className="screen game">
        <TopBar title={title} onBack={onBack} />
        <QuestionCard question={question} label={isAnswer ? `🤫 ${answerer}, answer in secret` : `🤔 Guess what ${answerer} said`} />
        <form
          className="answer-form"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <input
            autoFocus
            value={value}
            maxLength={120}
            onChange={(e) => (isAnswer ? setAnswer : setGuess)(e.target.value)}
            placeholder={isAnswer ? 'Your answer' : `${answerer}'s answer`}
          />
          <button className="save" disabled={!value.trim()}>
            {isAnswer ? 'Lock it in' : 'Reveal'}
          </button>
        </form>
      </main>
    )
  }

  // reveal
  return (
    <main className="screen game">
      <TopBar title={title} onBack={onBack} />
      <QuestionCard question={question} label="👀 The reveal" />
      <div className="reveal">
        <div>
          <span>{answerer} said</span>
          <strong>{answer}</strong>
        </div>
        <div>
          <span>{guesser} guessed</span>
          <strong>{guess}</strong>
        </div>
      </div>
      <p className="lead center">Did {guesser} get it, {answerer}?</p>
      <div className="step-actions">
        <button className="ghost grow" onClick={() => judge(false)}>
          ❌ Not quite
        </button>
        <button className="save grow" onClick={() => judge(true)}>
          ✅ Nailed it
        </button>
      </div>
    </main>
  )
}
