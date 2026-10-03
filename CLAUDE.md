# Vocab Trainer

React + Vite vocabulary quiz. Run `npm install` once, then `npm run dev`.

## Adding words
Words live in one file per first letter: `src/words/<letter>.json` (e.g. `a.json`, `b.json`),
each an array sorted alphabetically by word:
```json
[
  {
    "word": "ephemeral",
    "meaning": "Lasting for a very short time",
    "trick": "A memorable mnemonic",
    "examples": ["Example sentence one.", "Example sentence two."]
  }
]
```
- Optional `"level": "easy" | "medium" | "hard"` is the user's own difficulty mark, saved by the app.
  Never add, change or drop it when editing words.
- If the user doesn't supply a trick or examples, write good ones; keep the user's own tricks.
- If a word already exists, merge instead of adding a duplicate.
- New letter files are picked up automatically (`import.meta.glob` in `src/words.js`) — no build step.

## Difficulty marks
The app saves marks through a dev-server endpoint (`POST /api/level`, plugin in `vite.config.js`)
that rewrites the letter file. It only works under `npm run dev`; the static build is read-only.

## Files
- `src/App.jsx` — screen switching and practice sets (All, or one per letter)
- `src/session.js` — pure quiz logic (whole practice set shuffled, missed words requeued until all cleared)
- `src/components/` — `Home`, `Quiz` (Level 1: pick meaning, Level 2: spell from meaning), `Browse` (expandable word list), `WordDetails`, `LevelPicker`, `LevelFilter`
- `src/levels.js` — difficulty levels, filters, and the save call

## Deploy
Pushing to `main` deploys to GitHub Pages (https://madhavrjha.github.io/top-ten/) via
`.github/workflows/deploy.yml`. The live site is read-only: difficulty marks are only saved under `npm run dev`.
