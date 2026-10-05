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

## How the user revises (2026-10-05, stages)
Every word has a lifecycle the user sets by hand: 🆕 New → 👀 Recognise → ✍️ Recall (spelling) →
🗣️ Pronounce → ✅ Mastered. Only Mastered words are scheduled (spaced repetition). The repeat list (🔁),
Easy/Medium/Hard labels, Level 3 (fill in the blank) and Daily Review flashcards were removed at their
request — don't bring them back unless asked. Multiple choice (Pick the meaning) was removed and then
brought back on request. When the stages arrived, every word was reset to New.

## Features (what exists)
- **Stages** (`src/stages.js`): localStorage key `vocab.stages` = `{ "<lower>": { stage, since } }`; words
  not in the map are New. Mastered entries also hold `{ step, due, last }`: on becoming Mastered the first
  review is tomorrow; Knew it → next step of `INTERVALS` (1, 3, 7, 14, 30, 60, 120 days); Forgot → step 0
  (tomorrow) but it stays Mastered (the user moves stages themselves). Chosen with `StagePicker`: chips with
  keys 1–5 in Walk and in Spell after answering, a small dropdown on Browse rows. The old `vocab.repeat`
  key is removed on load.
- **Today** (top of Home, `src/daily.js`, `Today.jsx`, `Walk.jsx`): two daily tasks.
  📖 *Letter of the day* — go through every word of one letter, card by card (word → Space shows meaning →
  Enter = next/done; 1–5 sets the stage). Progress in `vocab.today` = `{ day, letter, letters: {a: [lower...]}, reviewed }`.
  New day: an unfinished letter carries over, a finished one moves to the next letter (wrapping).
  "Clear today's progress" (link in Today and a button under Saved data) resets the letter progress and
  undoes today's Mastered reviews (`reviewed` in `vocab.today` holds each word's entry from before its first
  review today); stages and everything else stay. Letter order: A–Z or 🔀 Shuffle
  (`vocab.letterShuffle`). ✅ *Mastered review* — Mastered words that are due, random order; each card ends
  with Forgot (F) / Knew it (Enter). Inside a walk, 🔀 Shuffle mixes the remaining cards.
- **Home**: set chips (All, one per stage, then one per letter) → **Pick the meaning**, **Spell the word** or
  **Browse words**; voice picker; **Clear today's progress** and **Clear all saved data** (removes all
  `vocab.*` localStorage keys after a confirm).
- **Pick the meaning** (multiple choice, `Quiz` with `mode="pick"`): see the word, choose its meaning from 4
  (wrong options have different meanings); keys 1–4, P before answering. Same requeue, stage chips and
  saved progress as Spell, stored in `vocab.spell` under `pick:<setId>`.
- **Spell the word**: type the word from its meaning. Letter blanks: click one to reveal it (all but
  the last); "Show hint" shows the trick (word masked). A different form (amplify vs amplifies) counts
  as "Almost". Whole set practised at once; missed words requeued until all are cleared. Enter / P / 1–5 keys.
  Progress is saved after every answer per set (`src/spellProgress.js`, key `vocab.spell` =
  `{ <setId>: { remaining: [lower...], cleared } }`) and resumed when the set is reopened; Home shows
  "Resume spelling"; "Start over" resets the set; finishing a set clears its entry.
- **Browse**: set chips, search by word only, rows collapsed until expanded (meaning, trick,
  "How to use", examples), 🔊 and a stage dropdown per row, Shuffle / A–Z, pages of 60 rows loaded on scroll.
- **Routing** (`src/router.js`, hash-based so GitHub Pages needs no rewrites): `#/`, `#/browse/<set>`,
  `#/spell/<set>`, `#/pick/<set>`, `#/today/letter`, `#/today/review` (<set> = all | new | recognise | recall | pronounce |
  mastered | a | b ...). Browser Back/Forward move between screens; unknown routes redirect home. Set chips
  in Browse use `replace`. (A Back-button "are you sure?" guard was tried and removed at the user's
  request — don't re-add it.)
- **Pronunciation**: browser text-to-speech (`src/speech.js`); novelty macOS voices filtered out;
  the default is always an en-US voice (user's request; best-sounding en-US first); voice choice saved in localStorage. In Spell it's only offered after answering.

## Files
- `src/words/<letter>.json` — the data. Loaded automatically via `import.meta.glob` in `src/words.js`.
- `src/utils.js` — `shuffle`, `norm`, `prepareWords` (precomputes `lower` and meaning `key`), date helpers
  (`today`, `addDays`, `daysBetween`), `clearSavedData`.
- `src/session.js` — pure quiz logic (modes 'spell' / 'pick', options for pick) + spelling check with a light stemmer.
- `src/stages.js` — stage storage, `setStage`, `gradeReview`, `isDue`, `dueLabel`, `INTERVALS`.
- `src/daily.js` — pure daily-task logic + `vocab.today` storage.
- `src/spellProgress.js` — saved Spell progress per set (`vocab.spell`).
- `src/speech.js` — voice ranking and `speak()`.
- `src/App.jsx` — routes → screens, sets (All / stages / letters), stage state, clear data, toast.
- `src/router.js` — `useRoute`, `navigate(to, {replace})`, `href`.
- `src/components/` — `Home`, `Today`, `Walk` (card-by-card go-through), `Quiz` (Spell the word / Pick the meaning),
  `Browse`, `WordDetails`, `SetPicker`, `StagePicker`, `SpeakButton`, `VoicePicker`.
- `vite.config.js` — `base: '/top-ten/'` for builds.

## Deploy
Pushing to `main` runs `.github/workflows/deploy.yml` (build → GitHub Pages). Pages source is set to
"GitHub Actions". Everything works on the live site; stages live in each browser.

## Environment notes
- Git push uses SSH as GitHub user `madhav1finance` (a collaborator on `madhavrjha/top-ten`).
  HTTPS has no stored credentials. `gh` CLI is not installed.
- Free pronunciation-audio APIs were unreliable when tested (dictionaryapi.dev timed out,
  Wikimedia rate-limited), so the app uses device voices only.

## Ideas offered but not built yet
- The user can paste their own sentences in chat for Claude to correct and save as examples.
- Syncing stages across devices (they're per browser today).
- A Pronounce practice screen (listen → say it aloud → mic check or self-rate) for 🗣️ words.
- Automatic stage moves (e.g. Recognise → Recall after knowing it on 3 days).
