import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import questionsData from './data/questions.json'
import { categoriesForMode } from './data/categories'
import { JOURNEY_QUESTIONS, type Journey } from './data/journeys'
import { Home } from './screens/Home'
import { Play } from './screens/Play'
import { Liked } from './screens/Liked'
import { Daily } from './screens/Daily'
import { Journeys } from './screens/Journeys'
import { Guess } from './screens/Guess'
import { Party } from './screens/Party'
import { Memory } from './screens/Memory'
import { Pair } from './screens/Pair'
import { DailyBanner, MoreWays } from './components/HomeExtras'
import { MatchToast } from './components/MatchToast'
import { dailyQuestion, dateKey, streak as computeStreak } from './lib/daily'
import { usePair } from './lib/usePair'
import {
  clearAll,
  loadDaily,
  loadFeedback,
  loadJourneys,
  loadLog,
  loadNotes,
  loadPlayers,
  loadSettings,
  newId,
  saveDaily,
  saveFeedback,
  saveJourneys,
  saveLog,
  saveNotes,
  savePlayers,
  saveSettings,
  type DailyMap,
  type FeedbackMap,
  type JourneyProgress,
  type LogEntry,
  type NotesMap,
} from './lib/storage'
import type { Question, Settings, Vote } from './types'

const QUESTIONS = questionsData as Question[]
const QUESTION_BY_ID = new Map([...QUESTIONS, ...JOURNEY_QUESTIONS].map((q) => [q.id, q]))

export type Screen = 'home' | 'play' | 'liked' | 'daily' | 'journeys' | 'guess' | 'party' | 'memory' | 'pair'

const likedIds = (fb: FeedbackMap) => Object.keys(fb).filter((id) => fb[id].vote === 'up')

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [feedback, setFeedback] = useState<FeedbackMap>(loadFeedback)
  const [notes, setNotes] = useState<NotesMap>(loadNotes)
  const [daily, setDaily] = useState<DailyMap>(loadDaily)
  const [journeys, setJourneys] = useState<JourneyProgress>(loadJourneys)
  const [log, setLog] = useState<LogEntry[]>(loadLog)
  const [players, setPlayers] = useState<string[]>(loadPlayers)
  const [match, setMatch] = useState<Question | null>(null)
  const clearMatch = useCallback(() => setMatch(null), [])

  const today = dateKey()
  const streak = computeStreak(daily, today)
  const todayQuestion = dailyQuestion(QUESTIONS, settings.mode ?? 'couples', today)
  const likes = useMemo(() => likedIds(feedback), [feedback])

  const { pair, setPair, sync, syncError, onSeenMatches } = usePair({ likes, notes, streak: streak.current, log })
  const partner = pair?.partner ?? null

  const partnerLikes = useMemo(() => new Set(partner?.likes ?? []), [partner])
  const matches = useMemo(
    () => likes.filter((id) => partnerLikes.has(id)).map((id) => QUESTION_BY_ID.get(id)).filter((q): q is Question => !!q),
    [likes, partnerLikes],
  )
  const newMatches = pair ? matches.filter((q) => !pair.seenMatches.includes(q.id)).length : 0

  // A fresh thumbs up on something the partner already liked is a match.
  const prevLikes = useRef(new Set(likes))
  useEffect(() => {
    const before = prevLikes.current
    prevLikes.current = new Set(likes)
    const fresh = likes.find((id) => !before.has(id) && partnerLikes.has(id))
    if (fresh) setMatch(QUESTION_BY_ID.get(fresh) ?? null)
  }, [likes, partnerLikes])

  const updateLog = (fn: (prev: LogEntry[]) => LogEntry[]) =>
    setLog((prev) => {
      const next = fn(prev)
      saveLog(next)
      return next
    })
  const addLog = (entry: Omit<LogEntry, 'id' | 'at'>) => updateLog((prev) => [...prev, { ...entry, id: newId(), at: Date.now() }])

  const rememberPlayers = (names: string[]) => {
    setPlayers(names)
    savePlayers(names)
  }

  const answerDaily = () => {
    const next = { ...daily, [today]: { questionId: todayQuestion.id, answeredAt: Date.now() } }
    setDaily(next)
    saveDaily(next)
  }

  const finishPart = (journey: Journey, part: number) => {
    const prev = journeys[journey.id]?.done ?? []
    if (!prev.includes(part)) {
      addLog({ kind: 'journey', title: `${journey.emoji} ${journey.title}: ${journey.parts[part].title}`, text: 'Finished this part together' })
    }
    const next = { ...journeys, [journey.id]: { done: [...new Set([...prev, part])], updatedAt: Date.now() } }
    setJourneys(next)
    saveJourneys(next)
  }

  const setNote = useCallback((id: string, text: string) => {
    setNotes((prev) => {
      const next = { ...prev }
      if (text) next[id] = { text, updatedAt: Date.now() }
      else delete next[id]
      saveNotes(next)
      return next
    })
  }, [])

  const updateSettings = (s: Settings) => {
    setSettings(s)
    saveSettings(s)
  }

  const updateFeedback = useCallback((fn: (prev: FeedbackMap) => FeedbackMap) => {
    setFeedback((prev) => {
      const next = fn(prev)
      saveFeedback(next)
      return next
    })
  }, [])

  const setVote = useCallback(
    (id: string, vote: Vote | undefined) =>
      updateFeedback((prev) => {
        const f = prev[id] ?? { seen: 0, lastSeen: 0 }
        return { ...prev, [id]: { ...f, vote } }
      }),
    [updateFeedback],
  )

  const reset = () => {
    clearAll()
    setFeedback({})
    setNotes({})
    setDaily({})
    setJourneys({})
    setLog([])
    setSettings({ mode: null, categories: [] })
  }

  const home = () => setScreen('home')
  const pairNames: [string, string] = [pair?.name ?? players[0] ?? '', partner?.name ?? players[1] ?? '']
  const toast = match && partner && <MatchToast key={match.id} question={match} partner={partner.name} onDone={clearMatch} />

  const other = (() => {
    switch (screen) {
      case 'daily':
        return (
          <Daily
            question={todayQuestion}
            daily={daily}
            streak={streak}
            notes={notes}
            setNote={setNote}
            onAnswered={answerDaily}
            partner={partner}
            onBack={home}
          />
        )
      case 'journeys':
        return <Journeys mode={settings.mode} progress={journeys} onPartDone={finishPart} notes={notes} setNote={setNote} onBack={home} />
      case 'guess':
        return <Guess defaultNames={pairNames} onFinish={(e, names) => (addLog(e), rememberPlayers(names))} onBack={home} />
      case 'party':
        return <Party questions={QUESTIONS} defaultPlayers={players} onFinish={(e, names) => (addLog(e), rememberPlayers(names))} onBack={home} />
      case 'memory':
        return (
          <Memory
            questionById={QUESTION_BY_ID}
            notes={notes}
            daily={daily}
            log={log}
            partner={partner}
            addMemory={(title, text) => addLog({ kind: 'memory', title, text })}
            removeLog={(id) => updateLog((prev) => prev.filter((l) => l.id !== id))}
            onBack={home}
          />
        )
      case 'pair':
        return <Pair pair={pair} setPair={setPair} sync={sync} syncError={syncError} matches={matches} onSeenMatches={onSeenMatches} onBack={home} />
      default:
        return null
    }
  })()

  if (other) return other

  if (screen === 'play' && settings.mode) {
    return (
      <>
      <Play
        questions={QUESTIONS}
        feedback={feedback}
        mode={settings.mode}
        categories={settings.shuffle ? categoriesForMode(settings.mode).map((c) => c.id) : settings.categories}
        shuffle={!!settings.shuffle}
        updateFeedback={updateFeedback}
        notes={notes}
        setNote={setNote}
        onBack={() => setScreen('home')}
        onLiked={() => setScreen('liked')}
      />
      {toast}
      </>
    )
  }

  if (screen === 'liked') {
    return (
      <Liked
        questions={QUESTIONS}
        feedback={feedback}
        setVote={setVote}
        notes={notes}
        setNote={setNote}
        onBack={() => setScreen(settings.mode ? 'play' : 'home')}
      />
    )
  }

  return (
    <Home
      questions={QUESTIONS}
      feedback={feedback}
      settings={settings}
      onChange={updateSettings}
      onStart={() => setScreen('play')}
      onLiked={() => setScreen('liked')}
      onReset={reset}
      top={<DailyBanner question={todayQuestion} streak={streak} onOpen={() => setScreen('daily')} />}
      more={<MoreWays pair={pair} newMatches={newMatches} onOpen={setScreen} />}
    />
  )
}
