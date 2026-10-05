// Each word's learning stage, chosen by you, saved in this browser as
// { "<lowercase word>": { stage, since } } in localStorage key vocab.stages.
// Words not in the map are New. Mastered words also get a review schedule
// ({ step, due, last }) that spaces reviews further apart each time you
// remember them.
import { today, addDays, daysBetween } from './utils.js';

export const STAGES = [
  { id: 'new', icon: '🆕', label: 'New', hint: 'Just added — read it and get to know it.' },
  { id: 'recognise', icon: '👀', label: 'Recognise', hint: 'Revise until you know the meaning when you see it.' },
  { id: 'recall', icon: '✍️', label: 'Recall', hint: 'Spell it from the meaning until it comes to you.' },
  { id: 'pronounce', icon: '🗣️', label: 'Pronounce', hint: 'Listen and say it aloud until it sounds right.' },
  { id: 'mastered', icon: '✅', label: 'Mastered', hint: 'Reviewed now and then, further apart each time.' },
];
export const STAGE_IDS = STAGES.map(s => s.id);
export const stageInfo = id => STAGES.find(s => s.id === id) || STAGES[0];

// Days until the next review of a Mastered word, by step.
export const INTERVALS = [1, 3, 7, 14, 30, 60, 120];

const KEY = 'vocab.stages';

export function loadStages() {
  try {
    localStorage.removeItem('vocab.repeat'); // the old repeat list, replaced by stages
    const v = JSON.parse(localStorage.getItem(KEY));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

export function saveStages(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

export function stageOf(map, word) {
  return map[word.lower]?.stage || 'new';
}

// Moves a word to a stage. New removes it from the map; Mastered starts the
// review schedule with the first review tomorrow.
export function setStage(map, word, stage, day = today()) {
  const next = { ...map };
  if (stage === 'new') delete next[word.lower];
  else if (stage === 'mastered') next[word.lower] = { stage, since: day, step: 0, due: addDays(day, INTERVALS[0]) };
  else next[word.lower] = { stage, since: day };
  return next;
}

// Review of a Mastered word: remembered → next step (longer gap);
// forgot → back to the first step (review tomorrow). It stays Mastered;
// move it to another stage yourself if it needs more practice.
export function gradeReview(map, word, remembered, day = today()) {
  const e = map[word.lower];
  if (!e || e.stage !== 'mastered') return map;
  const step = remembered ? Math.min((e.step || 0) + 1, INTERVALS.length - 1) : 0;
  return { ...map, [word.lower]: { ...e, step, due: addDays(day, INTERVALS[step]), last: day } };
}

// Undoes today's reviews: puts back each word's entry from before it was
// reviewed today (only if it is still a Mastered word reviewed today).
export function undoReviews(map, before, day = today()) {
  const next = { ...map };
  for (const [lower, entry] of Object.entries(before)) {
    if (next[lower]?.stage === 'mastered' && next[lower].last === day && entry) next[lower] = entry;
  }
  return next;
}

export function isDue(entry, day = today()) {
  return entry?.stage === 'mastered' && entry.due <= day;
}

export function reviewedToday(entry, day = today()) {
  return entry?.stage === 'mastered' && entry.last === day;
}

// "review today", "review tomorrow", "review in 5 days".
export function dueLabel(entry, day = today()) {
  if (entry?.stage !== 'mastered') return '';
  const n = daysBetween(day, entry.due);
  if (n <= 0) return 'review today';
  return n === 1 ? 'review tomorrow' : `review in ${n} days`;
}
