import { useCallback, useState } from 'react'
import questionsData from './data/questions.json'
import { Home } from './screens/Home'
import { Play } from './screens/Play'
import { Liked } from './screens/Liked'
import { clearAll, loadFeedback, loadSettings, saveFeedback, saveSettings, type FeedbackMap } from './lib/storage'
import type { Question, Settings, Vote } from './types'

const QUESTIONS = questionsData as Question[]

type Screen = 'home' | 'play' | 'liked'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [feedback, setFeedback] = useState<FeedbackMap>(loadFeedback)

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
    setSettings({ mode: null, categories: [] })
  }

  if (screen === 'play' && settings.mode) {
    return (
      <Play
        questions={QUESTIONS}
        feedback={feedback}
        mode={settings.mode}
        categories={settings.categories}
        updateFeedback={updateFeedback}
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
