# Vocab Trainer

A personal vocabulary app for learning and revising English words. React + Vite, no backend.
Run `npm install` once, then `npm run dev` (http://localhost:5173).
Live site: https://madhavrjha.github.io/top-ten/ (GitHub repo `madhavrjha/top-ten`, branch `main`).

## Most common task: the user pastes new words

The user pastes lists, often loosely formatted, e.g. `Word - trick - meaning`, `Word - meaning`,
just `Word`, or WhatsApp lines with timestamps (`[7:33 pm, 3/10/2026] Madhav: ...`). Steps:

1. `git pull --ff-only` first (commits may come from elsewhere).
2. Check which words already exist in `src/words/*.json` — skip or merge them, never duplicate.
   Tell the user which ones were skipped.
3. Fix spelling mistakes (e.g. "adevnture" → adventure, "apparant" → apparent) and say which you fixed.
4. Write each entry into `src/words/<first-letter>.json` (create the file if the letter is new).
   Keep the array sorted alphabetically by `word`; `word` is lowercase unless a proper noun.
5. Validate: every entry has `word`, `meaning`, `trick`, exactly 2 `examples`, and `usage`; each
   example must contain the word (or a form of it) so Level 3 can blank it; JSON parses;
   `npx vite build --logLevel error` succeeds.
6. Run `git status` — if other word files show changes, they are the user's own difficulty marks
   (check with `git diff`). Never revert them; mention them and include them in the next commit.
7. Do NOT commit/push until the user says so ("commit and push" is the usual phrase).

### Writing entries
```json
{
  "word": "ephemeral",
  "meaning": "Lasting for a very short time",
  "trick": "A memorable mnemonic",
  "examples": ["Example sentence one.", "Example sentence two."],
  "usage": {
    "pos": "adjective",
    "pattern": "be ephemeral / an ephemeral + noun",
    "partners": ["ephemeral fame", "ephemeral beauty"]
  },
  "level": "hard"
}
```
- **meaning**: short, plain, dictionary-style. Don't include the word itself. If the user's note is
  blank or cut off, write it. Fix factual slips (e.g. "artery = vein" → correct meaning, keep "vein" in the trick).
- **trick**: keep the user's own mnemonic (even Hinglish, e.g. "sabki sahmati se", "Andrew tate - hair cut").
  If none given, write a short, memorable one (sound-alikes, word roots, spelling hooks).
- **examples**: exactly 2, **easy everyday sentences** (the user asked for easy ones). If the user gave a
  usage ("Laila ambled around the house", "floor was awash"), use it as one example.
- **usage**: how to use the word in a sentence (the user recognises words but struggles to use them).
  `pos` = word type matching the form as written ("verb (past)", "noun (plural)", "adjective (slang)");
  `pattern` = grammar frame with someone/something/doing placeholders ("abstain from something /
  from doing something", "bear the brunt of something"); `partners` = 2–3 common collocations.
  Key order in the file: word, meaning, trick, examples, usage, level.
- **level**: the user's own Easy/Medium/Hard mark, written by the app. **Never add, change or remove it.**
- Different forms are separate entries (abolish / abolished, astonished / astonishing / astonishment).
  A phrase that is just the usual use of a word gets merged (e.g. "brink" + "brink of" → one "brink").
  Multi-word phrases are fine ("akin to", "with one accord" → goes in `w.json` by first letter).
- Slang/rude words: include them, but say so in the meaning ("rude slang", "informal").

## How the user likes to work
- Short replies with a clear summary of what changed; tables are welcome.
- Only commit and push when asked. Commit messages end with the Co-Authored-By line.
- After pushing, remind them the live site updates in a minute or two.
- For bigger features they sometimes ask for a plan first — give the plan, then build after "go/do it".
- Before building something ambiguous, ask one focused question (e.g. "remove that set of 10" was ambiguous).

## Features (what exists)
- **Daily review** (`src/review.js`, `Review.jsx`): flashcards with spaced repetition across all words.
  Flip (Space), rate Forgot/Hard/Good (1/2/3). Ladder of gaps 1,3,7,14,30,60,120,240 days; Good moves
  up (first Good = 1 week), Hard = 3 days or repeats the gap, Forgot = tomorrow and the card comes back
  3 cards later in the same session. Hard-marked words get 25% shorter gaps, Easy-marked 25% longer.
  Max 10 new words/day, Hard-marked first. Saved in localStorage key `vocab.review` (per device).
- **Home**: practice set picker (All random, or one letter) + difficulty filter (Any/Unmarked/Easy/Medium/Hard),
  voice picker for pronunciation.
- **Level 1 – Pick the meaning**: 4 options, distractors have distinct meanings. Keys 1–4, Enter, P (speak).
- **Level 2 – Spell the word**: type the word from its meaning. Letter blanks shown from the start;
  click any blank to reveal that letter (all but the last); "Show hint" shows the trick (word masked).
  A different form of the right word (amplify vs amplifies) counts as "Almost" (cleared, amber).
- Whole set practised at once; a missed word is requeued a few questions later until all are cleared.
- **Level 3 – Fill in the blank**: an example sentence with the word blanked (`findClozes` in
  `session.js` finds the word or a form of it, incl. multi-word phrases); type the blanked text.
  Same clickable blanks as Level 2; "Show hint" shows the meaning; other forms count as "Almost".
- After each answer: details (incl. "How to use") + Easy/Medium/Hard buttons (keys E/M/H).
- **Browse**: letter + difficulty filters, search by word only, rows collapsed (meaning hidden until
  expanded), Shuffle / A–Z order, 🔊 per row, pages of 60 rows loaded on scroll.
- **Pronunciation**: browser text-to-speech (`src/speech.js`); novelty macOS voices filtered out;
  voice choice saved in localStorage. In Level 2 it's only offered after answering.

## Files
- `src/words/<letter>.json` — the data. Loaded automatically via `import.meta.glob` in `src/words.js`.
- `src/utils.js` — `shuffle`, `norm`, `prepareWords` (precomputes `lower` and meaning `key`).
- `src/session.js` — pure quiz logic + spelling check with a light stemmer.
- `src/levels.js` — levels, filters, `saveLevel` (POST /api/level).
- `src/speech.js` — voice ranking and `speak()`.
- `src/review.js` — pure spaced-repetition logic (plan, rate, intervals, stats) + localStorage.
- `src/App.jsx` — screens, practice sets, difficulty state (optimistic save + revert on failure), toast.
- `src/components/` — `Home`, `Quiz`, `Browse`, `WordDetails`, `SetPicker`, `LevelFilter`,
  `LevelPicker`, `SpeakButton`, `VoicePicker`, `Review`.
- `vite.config.js` — `base: '/top-ten/'` for builds; `word-levels` dev plugin that saves marks into
  letter files and suppresses HMR reloads for its own writes.

## Deploy
Pushing to `main` runs `.github/workflows/deploy.yml` (build → GitHub Pages). Pages source is set to
"GitHub Actions". The live site is read-only: Easy/Medium/Hard buttons are hidden there
(`CAN_SAVE = import.meta.env.DEV`); marks are made locally under `npm run dev`, then committed.

## Environment notes
- Git push uses SSH as GitHub user `madhav1finance` (a collaborator on `madhavrjha/top-ten`).
  HTTPS has no stored credentials. `gh` CLI is not installed.
- Free pronunciation-audio APIs were unreliable when tested (dictionaryapi.dev timed out,
  Wikimedia rate-limited), so the app uses device voices only.

## Ideas offered but not built yet
- "Write your own sentence" step in Daily Review (saved with the word as "My sentence").
- The user can paste their own sentences in chat for Claude to correct and save as examples.
- "Weak words" set built from words the user gets wrong.
- Marking Easy/Medium/Hard on the live site (option A: browser-only storage; option B: commit to GitHub
  via the API with a personal token). User hasn't chosen.
