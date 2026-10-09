// Study sets: every word in fixed sets of 20, most common first (built by
// scripts/make_sets.py into studysets.json). Progress per set is saved in this
// browser as { "<set number>": { status, started, step, due, lastReview, rounds } }
// in localStorage key vocab.studySets; sets not in the map are Untouched.
//
// Learning day: go through the set LEARN_ROUNDS times. After that, one review
// is due after each gap in REVIEW_GAPS (day 2, 4, 8, 15, 30); finishing the
// last review marks the set Completed.
import SETLIST from './studysets.json';
import { today, addDays, daysBetween } from './utils.js';

export const LEARN_ROUNDS = 3;
export const REVIEW_GAPS = [1, 2, 4, 7, 15];
export const STATUSES = [
  { id: 'untouched', icon: '⚪', label: 'Untouched' },
  { id: 'ongoing', icon: '🔵', label: 'Ongoing' },
  { id: 'completed', icon: '✅', label: 'Completed' },
];

const KEY = 'vocab.studySets';

// → [{ number, words: [word objects] }] for the given prepared words.
export function buildStudySets(words) {
  const byLower = new Map(words.map(w => [w.lower, w]));
  return SETLIST.sets
    .map((list, i) => ({ number: i + 1, words: list.map(l => byLower.get(l)).filter(Boolean) }))
    .filter(s => s.words.length);
}

export function loadProgress() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

export function saveProgress(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

export const statusOf = rec => rec?.status || 'untouched';

export function roundsToday(rec, day = today()) {
  return rec?.rounds?.day === day ? rec.rounds.n : 0;
}

export function isLearningToday(rec, day = today()) {
  return rec?.status === 'ongoing' && rec.started === day;
}

// A review is due when the set is Ongoing, past its learning day, and its due
// date has come (and it hasn't been reviewed today already).
export function isDueSet(rec, day = today()) {
  return rec?.status === 'ongoing' && rec.started !== day && rec.due <= day && rec.lastReview !== day;
}

// Starts learning a set today.
export function startSet(map, number, day = today()) {
  return { ...map, [number]: { status: 'ongoing', started: day, step: 0, due: addDays(day, REVIEW_GAPS[0]), rounds: { day, n: 0 } } };
}

// Called when a whole round of the set is finished. On a review day the first
// finished round counts as that review and schedules the next one.
export function finishRound(map, number, day = today()) {
  const rec = map[number];
  if (!rec) return map;
  const next = { ...rec, rounds: { day, n: roundsToday(rec, day) + 1 } };
  if (isDueSet(rec, day)) {
    next.step = (rec.step || 0) + 1;
    next.lastReview = day;
    if (next.step >= REVIEW_GAPS.length) {
      next.status = 'completed';
      next.completedOn = day;
      next.due = null;
    } else {
      next.due = addDays(day, REVIEW_GAPS[next.step]);
    }
  }
  return { ...map, [number]: next };
}

// Changing the status by hand. Ongoing from Untouched starts it today;
// Ongoing from Completed puts it back in the reviews, due today.
export function setStatus(map, number, status, day = today()) {
  const rec = map[number];
  if (status === 'untouched') {
    const next = { ...map };
    delete next[number];
    return next;
  }
  if (status === 'completed') return { ...map, [number]: { ...(rec || { started: day, step: 0 }), status, completedOn: day, due: null } };
  if (!rec) return startSet(map, number, day);
  return { ...map, [number]: { ...rec, status: 'ongoing', due: rec.status === 'completed' ? day : rec.due } };
}

// "due today", "due tomorrow", "due in 5 days", "2 days late".
export function dueText(rec, day = today()) {
  if (rec?.status !== 'ongoing' || !rec.due) return '';
  const n = daysBetween(day, rec.due);
  if (n === 0) return 'due today';
  if (n < 0) return `${-n} day${n === -1 ? '' : 's'} late`;
  return n === 1 ? 'due tomorrow' : `due in ${n} days`;
}

// Where an Ongoing set is: "learning today" or "review 2 of 5 · due in 3 days".
export function stepText(rec, day = today()) {
  if (rec?.status !== 'ongoing') return '';
  if (rec.started === day) return 'learning today';
  return `review ${(rec.step || 0) + 1} of ${REVIEW_GAPS.length} · ${dueText(rec, day)}`;
}
