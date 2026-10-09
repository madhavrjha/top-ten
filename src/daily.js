// Today's saved state, so "Clear today's progress" can undo today only:
// `reviewed` keeps each Mastered word's entry from before its first review
// today, and `setsBefore` each study set's progress from before its first
// change today. Reset every new day.
import { today } from './utils.js';

const KEY = 'vocab.today';

function fresh(day) {
  return { day, reviewed: {}, setsBefore: {} };
}

export function loadDaily(day = today()) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* storage unavailable */ }
  if (saved && saved.day === day) {
    return { ...fresh(day), reviewed: saved.reviewed || {}, setsBefore: saved.setsBefore || {} };
  }
  return fresh(day);
}

export function saveDaily(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// Remembers a Mastered word's entry before its first review today.
export function noteReview(state, word, entryBefore) {
  if (word.lower in state.reviewed) return state;
  return { ...state, reviewed: { ...state.reviewed, [word.lower]: entryBefore } };
}

// Remembers a study set's progress before its first change today (null = Untouched).
export function noteSet(state, number, before) {
  if (number in state.setsBefore) return state;
  return { ...state, setsBefore: { ...state.setsBefore, [number]: before ?? null } };
}

export function clearToday(state) {
  return fresh(state.day);
}
