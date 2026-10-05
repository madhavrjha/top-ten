// Today's tasks: go through every word of one letter, and go through the
// repeat list REPEAT_ROUNDS times. Progress is saved per day in localStorage;
// a new day resets the repeat rounds and either continues an unfinished letter
// or moves on to the next one.
import { today } from './repeat.js';

export const REPEAT_ROUNDS = 3;
const KEY = 'vocab.today';

function fresh(day, letter) {
  return { day, letter, letters: {}, rounds: 0, roundDone: [] };
}

// letterWords: { a: [...words], b: [...] }
export function loadDaily(letterWords, day = today()) {
  const letters = Object.keys(letterWords).sort();
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* storage unavailable */ }

  if (saved && saved.day === day && letters.includes(saved.letter)) {
    return { ...fresh(day, saved.letter), ...saved };
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

// Marks a repeat word as gone through in the current round. When every word
// on the repeat list is done, the round counts and the next one starts.
export function markRepeatDone(state, word, repeatWords) {
  if (state.rounds >= REPEAT_ROUNDS || state.roundDone.includes(word.lower)) return state;
  const roundDone = [...state.roundDone, word.lower];
  const done = new Set(roundDone);
  if (repeatWords.length && repeatWords.every(w => done.has(w.lower))) {
    return { ...state, rounds: state.rounds + 1, roundDone: [] };
  }
  return { ...state, roundDone };
}

export function clearToday(state) {
  return fresh(state.day, state.letter);
}
