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
   example should contain the word (or a form of it); JSON parses;
   `npx vite build --logLevel error` succeeds.
6. Do NOT commit/push until the user says so ("commit and push" is the usual phrase).

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
  }
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
  Key order in the file: word, meaning, trick, examples, usage.
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

## How the user revises (2026-10-05 redesign)
The user goes through one letter a day in Browse. Words they forget or want to drill go on their
**repeat list** (🔁), which they practise for some days and unset themselves. Easy/Medium/Hard labels,
Level 1 (multiple choice), Level 3 (fill in the blank) and Daily Review flashcards were removed at their
request — don't bring them back unless asked.

## Features (what exists)
- **Today** (top of Home, `src/daily.js`, `Today.jsx`, `Walk.jsx`): two daily tasks.
  📖 *Letter of the day* — go through every word of one letter, card by card (word → Space shows meaning →
  Enter = next/done; 🔁 or R adds to repeat list). 🔁 *Repeat words* — go through the repeat list
  `REPEAT_ROUNDS` (3) times; a round counts when every repeat word is done; pause screen between rounds.
  Progress in localStorage key `vocab.today` = `{ day, letter, letters: {a: [lower...]}, rounds, roundDone }`.
  New day: rounds reset; an unfinished letter carries over its progress, a finished one moves to the
  next letter (wrapping). "Clear today's progress" resets today (keeps the letter and repeat list).
  Letter order: A–Z or 🔀 Shuffle (saved in `vocab.letterShuffle`); repeat rounds are always random.
  Inside a walk, 🔀 Shuffle mixes the remaining cards.
- **Home**: set chips (All, 🔁 Repeat, one per letter) → **Spell the word** or **Browse words**;
  voice picker; **Clear saved data** (removes all `vocab.*` localStorage keys after a confirm).
- **Repeat list** (`src/repeat.js`): localStorage key `vocab.repeat` = `{ "<lowercase word>": "YYYY-MM-DD added" }`.
  Toggled with 🔁 on Browse rows and after answering in Spell (key R). Per device; works on the live site.
- **Spell the word**: type the word from its meaning. Letter blanks: click one to reveal it (all but
  the last); "Show hint" shows the trick (word masked). A different form (amplify vs amplifies) counts
  as "Almost". Whole set practised at once; missed words requeued until all are cleared. Enter / P / R keys.
- **Browse**: set chips, search by word only, rows collapsed until expanded (meaning, trick,
  "How to use", examples), 🔊 and 🔁 per row, Shuffle / A–Z, pages of 60 rows loaded on scroll.
- **Pronunciation**: browser text-to-speech (`src/speech.js`); novelty macOS voices filtered out;
  voice choice saved in localStorage. In Spell it's only offered after answering.

## Files
- `src/words/<letter>.json` — the data. Loaded automatically via `import.meta.glob` in `src/words.js`.
- `src/utils.js` — `shuffle`, `norm`, `prepareWords` (precomputes `lower` and meaning `key`).
- `src/session.js` — pure spelling-quiz logic + spelling check with a light stemmer.
- `src/repeat.js` — repeat list storage, `sinceLabel`, `clearSavedData`.
- `src/daily.js` — pure daily-task logic + `vocab.today` storage.
- `src/speech.js` — voice ranking and `speak()`.
- `src/App.jsx` — screens, sets (All / Repeat / letters), repeat state, clear data, toast.
- `src/components/` — `Home`, `Today`, `Walk` (card-by-card go-through), `Quiz` (Spell the word),
  `Browse`, `WordDetails`, `SetPicker`, `RepeatButton`, `SpeakButton`, `VoicePicker`.
- `vite.config.js` — `base: '/top-ten/'` for builds.

## Deploy
Pushing to `main` runs `.github/workflows/deploy.yml` (build → GitHub Pages). Pages source is set to
"GitHub Actions". Everything works on the live site; the repeat list lives in each browser.

## Environment notes
- Git push uses SSH as GitHub user `madhav1finance` (a collaborator on `madhavrjha/top-ten`).
  HTTPS has no stored credentials. `gh` CLI is not installed.
- Free pronunciation-audio APIs were unreliable when tested (dictionaryapi.dev timed out,
  Wikimedia rate-limited), so the app uses device voices only.

## Ideas offered but not built yet
- The user can paste their own sentences in chat for Claude to correct and save as examples.
- Syncing the repeat list across devices (it's per browser today).
