import type { Depth, Mode, Question } from '../types'
import type { CategoryId } from './categories'

export interface JourneyPart {
  title: string
  questions: Question[]
}

export interface Journey {
  id: string
  title: string
  emoji: string
  blurb: string
  mode: Mode | 'both'
  /** Card color per part, light to deep */
  categories: [CategoryId, CategoryId, CategoryId]
  parts: JourneyPart[]
}

interface Source {
  id: string
  title: string
  emoji: string
  blurb: string
  mode: Mode | 'both'
  categories: [CategoryId, CategoryId, CategoryId]
  parts: { title: string; questions: string[] }[]
}

/** Guided sets that go from light to deep, one part per sitting. */
const SOURCES: Source[] = [
  {
    id: 'first-dates',
    title: 'First dates',
    emoji: '💫',
    blurb: 'Get to know each other, one date at a time',
    mode: 'couples',
    categories: ['warmup', 'throwback', 'us'],
    parts: [
      {
        title: 'Getting to know you',
        questions: [
          'What does a perfect lazy Sunday look like for you?',
          "What's something you're weirdly good at?",
          'Which place in the world do you want to see next, and why there?',
          "What's the best meal you've ever had?",
          'What always makes you laugh, no matter your mood?',
          "What's a hobby you'd pick up if time and money were no issue?",
        ],
      },
      {
        title: 'Stories',
        questions: [
          "What's a moment from your childhood that still makes you smile?",
          'Who has had the biggest influence on who you are today?',
          "What's the bravest thing you've ever done?",
          "What's something you changed your mind about in the last few years?",
          "What's a small win from this year you're proud of?",
          'When do you feel most like yourself?',
        ],
      },
      {
        title: 'What matters',
        questions: [
          'What does a good relationship look like to you?',
          "What's something you need from the people close to you, but rarely ask for?",
          'Who are you working on becoming?',
          "What's a dream you haven't told many people about?",
          'How do you usually show someone you care?',
          'What made you want to see me again after our first date?',
        ],
      },
    ],
  },
  {
    id: 'fall-deeper',
    title: '36 questions to fall deeper',
    emoji: '💘',
    blurb: 'Three sets of twelve that slowly open you up, inspired by the famous closeness study',
    mode: 'couples',
    categories: ['warmup', 'deep', 'us'],
    parts: [
      {
        title: 'Set one',
        questions: [
          'What would a perfect ordinary day look like for you, from waking up to falling asleep?',
          'If you could relive one day of your life exactly as it was, which would it be?',
          "What's something you've always wanted to try but keep putting off?",
          'Who is the first person you text when you have good news?',
          "What's a smell or sound that takes you straight back to childhood?",
          "What's a compliment you still remember years later?",
          'If you could instantly master a language, an instrument or a sport, which would you pick?',
          "What's the kindest thing a stranger has ever done for you?",
          'What do people usually get wrong about you at first?',
          "What's something you're looking forward to this month?",
          'What were you like at fifteen?',
          "What's a tiny habit of mine you've noticed and secretly like?",
        ],
      },
      {
        title: 'Set two',
        questions: [
          'What memory do you treasure more than almost anything?',
          "What's something you believe that most people around you don't?",
          'What does friendship mean to you, and has that changed over time?',
          'How much warmth and affection was there in the home you grew up in?',
          "What's a goal you gave up on, and do you ever think about going back to it?",
          'If you knew you had one year left, what would you change about how you live?',
          "What's the hardest thing you've ever had to forgive?",
          'When did you last cry, and what was it about?',
          'What are you most grateful for right now?',
          "What's something you wish someone had told you when you were younger?",
          'Which relationship in your life has taught you the most?',
          "What's something you've never told me that you'd like me to know?",
        ],
      },
      {
        title: 'Set three',
        questions: [
          'Take turns finishing this sentence three times: "We both..."',
          "What's something you admire about me that you haven't said out loud?",
          "What's an embarrassing moment you can laugh about now?",
          "What's a fear you carry that you rarely talk about?",
          "If I noticed you were struggling but not saying anything, what would you want me to do?",
          "What's a moment with me you'd love to relive?",
          "What's one thing you'd like us to do together this year?",
          'What do you think I need more of in my life right now?',
          'If our relationship were a book, what would this chapter be called?',
          "What's a question you've been nervous to ask me?",
          'What makes you feel safe with someone?',
          "Look into each other's eyes for one full minute without talking, then share what went through your mind.",
        ],
      },
    ],
  },
  {
    id: 'long-distance',
    title: 'Long distance',
    emoji: '📬',
    blurb: 'Stay close when you are far apart',
    mode: 'couples',
    categories: ['fun', 'us', 'dreams'],
    parts: [
      {
        title: 'Across the miles',
        questions: [
          "What's the first thing you want to do together when we're in the same place again?",
          'Describe your day today in five words.',
          'What did you see today that reminded you of me?',
          'Which song should we both listen to at the same time tonight?',
          "What's a snack or dish from where you are that I have to try?",
          "What's a photo on your phone from this week that tells a story?",
        ],
      },
      {
        title: 'Staying close',
        questions: [
          'When during a normal week do you miss me the most?',
          'What could I do to make you feel closer, even from far away?',
          'Which of our calls or messages has meant the most to you?',
          "What's a routine we could share, even in different places?",
          "How do you like to be comforted after a hard day when I can't be there?",
          "What's something about the distance that's been easier than you expected?",
        ],
      },
      {
        title: 'The future',
        questions: [
          'What does closing the distance look like to you, and when do you picture it?',
          'If you are honest, what worries you most about the distance?',
          'What have we learned about each other because of being apart?',
          'Where would you love for us to live one day?',
          "What's a promise you'd like us to make for the time we're apart?",
          'What will you remember most about this long distance chapter?',
        ],
      },
    ],
  },
  {
    id: 'old-friends',
    title: 'Old friends',
    emoji: '🤝',
    blurb: 'Look back at your friendship and ahead to what is next',
    mode: 'friends',
    categories: ['throwback', 'friends', 'gratitude'],
    parts: [
      {
        title: 'Remember when',
        questions: [
          "What's the first memory you have of us hanging out?",
          "What's the most ridiculous thing we've ever done together?",
          'Which of our inside jokes would make zero sense to anyone else?',
          "What's a trip or night out we still need to repeat?",
          'What was your first impression of me, honestly?',
          'Which song instantly reminds you of our friendship?',
        ],
      },
      {
        title: "How we've changed",
        questions: [
          'How have I changed since we first met?',
          "What's something you've learned from me, even if I didn't mean to teach it?",
          'Which period of our friendship was the hardest, and what got us through it?',
          "What's going on in your life right now that I don't know enough about?",
          'When have you felt proudest of me?',
          "What do we have in common now that we didn't before?",
        ],
      },
      {
        title: "What's next",
        questions: [
          "What's something you're going through that you haven't told many people?",
          'How can I be a better friend to you this year?',
          "What's a tradition we should start?",
          'Where do you see us in ten years?',
          'What do you value most about our friendship?',
          "What's something you've always wanted to say to me but never did?",
        ],
      },
    ],
  },
  {
    id: 'new-friends',
    title: 'New friends',
    emoji: '🌱',
    blurb: 'Turn someone new into a real friend',
    mode: 'friends',
    categories: ['warmup', 'throwback', 'values'],
    parts: [
      {
        title: 'The basics',
        questions: [
          'Where did you grow up, and what was it like?',
          "What's something you could talk about for hours?",
          "What's your ideal way to spend a Friday night?",
          'Which show, book or game are you into right now?',
          "What's the best advice you've ever gotten?",
          "What's a food you'll never say no to?",
        ],
      },
      {
        title: 'The stories',
        questions: [
          "What's a job or experience that shaped you?",
          "What's the most spontaneous thing you've ever done?",
          "Who's someone you look up to, and why?",
          "What's a place that feels like home to you?",
          "What's something you're working towards right now?",
          "What's a fun fact about you that surprises people?",
        ],
      },
      {
        title: 'Going deeper',
        questions: [
          'What makes a friendship really work for you?',
          "What's a value you try to live by?",
          "What's something you'd like to get better at this year?",
          'When do you feel most at ease with people?',
          "What's something people often misunderstand about you?",
          "What's one thing we should do together soon?",
        ],
      },
    ],
  },
]

export const JOURNEYS: Journey[] = SOURCES.map((s) => ({
  ...s,
  parts: s.parts.map((p, pi) => ({
    title: p.title,
    questions: p.questions.map((text, qi) => ({
      id: `journey-${s.id}-${pi + 1}-${qi + 1}`,
      text,
      category: s.categories[pi],
      mode: s.mode,
      depth: Math.min(3, pi + 1) as Depth,
    })),
  })),
}))

export const JOURNEY_QUESTIONS: Question[] = JOURNEYS.flatMap((j) => j.parts.flatMap((p) => p.questions))
