// Letter of the day: go through every word of one letter. Progress is saved
// per day in localStorage; a new day either continues an unfinished letter
// or moves on to the next one. Mastered reviews are scheduled in stages.js;
// `reviewed` keeps each word's entry from before today's review so
// "Clear today's progress" can undo it.
import { today } from './utils.js';

const KEY = 'vocab.today';

function fresh(day, letter) {
  return { day, letter, letters: {}, reviewed: {} };
}

// letterWords: { a: [...words], b: [...] }
export function loadDaily(letterWords, day = today()) {
  const letters = Object.keys(letterWords).sort();
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* storage unavailable */ }

  if (saved && saved.day === day && letters.includes(saved.letter)) {
    return { ...fresh(day, saved.letter), letters: saved.letters || {}, reviewed: saved.reviewed || {} };
  }
  // New day: continue an unfinished letter where you left off, otherwise
  // move on to the next letter.
  if (saved && letters.includes(saved.letter)) {
    const doneList = saved.letters?.[saved.letter] || [];
    const done = new Set(doneList);
    if (!letterWords[saved.letter].every(w => done.has(w.lower))) {
      return { ...fresh(day, saved.letter), letters: { [saved.letter]: doneList } };
    }
    return fresh(day, letters[(letters.indexOf(saved.letter) + 1) % letters.length]);
  }
  return fresh(day, letters[0] || '');
}

export function saveDaily(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function setLetter(state, letter) {
  return { ...state, letter };
}

export function letterDoneSet(state, letter = state.letter) {
  return new Set(state.letters[letter] || []);
}

export function markLetterDone(state, word) {
  const done = state.letters[state.letter] || [];
  if (done.includes(word.lower)) return state;
  return { ...state, letters: { ...state.letters, [state.letter]: [...done, word.lower] } };
}

// Remembers a Mastered word's entry before its first review today.
export function noteReview(state, word, entryBefore) {
  if (word.lower in state.reviewed) return state;
  return { ...state, reviewed: { ...state.reviewed, [word.lower]: entryBefore } };
}

export function clearToday(state) {
  return fresh(state.day, state.letter);
}
