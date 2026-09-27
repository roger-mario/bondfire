# Bondfire 🔥

A phone-first web app with conversation questions for couples and friends. Pick who's playing and which categories you're in the mood for, then swipe through question cards:

- **Swipe left** (or tap 👍 on the card): more like this
- **Swipe right** (or tap 👎 on the card): less like this
- **Swipe up**: skip without voting
- **Undo**: bring back the last card

Pick **Random** to get questions from every category in a fully shuffled order, without the recommendations.

Every thumbs up or down teaches the app what you enjoy, and the next cards are picked to match your taste.

## Stack

- [Vite](https://vite.dev) + React + TypeScript, no backend
- Data is stored in the browser with `localStorage` (votes, liked questions, settings)
- Installable to the home screen (web app manifest)

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint
```

## Deploy on Vercel

Import the GitHub repository in Vercel. It detects Vite automatically (build command `npm run build`, output directory `dist`), so no extra configuration is needed. Every push to `main` deploys to production.

## Project layout

| Path | What it holds |
| --- | --- |
| `src/data/questions.json` | The 250 questions (`id`, `text`, `category`, `mode`, `depth`) |
| `src/data/categories.ts` | Category names, emoji, colors and which mode they appear in |
| `src/lib/recommend.ts` | The recommendation logic |
| `src/lib/storage.ts` | Reading and writing local data |
| `src/components/SwipeCard.tsx` | The draggable card |
| `src/screens/` | Home, Play and Liked screens |

### Question fields

- `mode`: `couples`, `friends` or `both`
- `depth`: `1` light, `2` medium, `3` deep

To add questions, append entries to `questions.json` with a unique `id`.

## How the recommendations work

Each vote counts toward the question's **category** and its **depth**. For every new card the app runs a Thompson sampling step: for each category and depth it draws a random score from a Beta(likes + 1, dislikes + 1) distribution. Well-liked categories tend to draw high, disliked ones low, and ones with few votes can land anywhere, so the app keeps exploring instead of locking in too early. Question history then adjusts the score:

- never-shown questions are preferred
- liked questions can come back later
- disliked questions almost never come back

A question is never repeated within the same session.

When a shared database is added later (for example on Vercel), the same votes can be sent to the server to rank questions across all users.
