import { useCallback, useState } from 'react'
import questionsData from './data/questions.json'
import { categoriesForMode } from './data/categories'
import { Home } from './screens/Home'
import { Play } from './screens/Play'
import { Liked } from './screens/Liked'
import {
  clearAll,
  loadFeedback,
  loadNotes,
  loadSettings,
  saveFeedback,
  saveNotes,
  saveSettings,
  type FeedbackMap,
  type NotesMap,
} from './lib/storage'
import type { Question, Settings, Vote } from './types'

const QUESTIONS = questionsData as Question[]

type Screen = 'home' | 'play' | 'liked'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [feedback, setFeedback] = useState<FeedbackMap>(loadFeedback)
  const [notes, setNotes] = useState<NotesMap>(loadNotes)

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
    setSettings({ mode: null, categories: [] })
  }

  if (screen === 'play' && settings.mode) {
    return (
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
    />
  )
}
