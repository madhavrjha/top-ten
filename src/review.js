// Daily Review: flashcards with spaced repetition.
// Each word's schedule is a "step" on a ladder of intervals; remembering moves it up
// (longer gap), forgetting drops it back to tomorrow. Saved per device in localStorage.

export const NEW_PER_DAY = 10;
const LADDER = [1, 3, 7, 14, 30, 60, 120, 240]; // days until the next review
const STORE_KEY = 'vocab.review';

export const RATINGS = [
  { id: 'forgot', label: 'Forgot', key: '1' },
  { id: 'hard', label: 'Hard', key: '2' },
  { id: 'good', label: 'Good', key: '3' },
];

/* ---------- dates (local calendar days, as YYYY-MM-DD) ---------- */

export function today(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

/* ---------- storage ---------- */

export function emptyState() {
  return { cards: {}, newDay: '', newCount: 0 };
}

export function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && typeof s.cards === 'object') return { ...emptyState(), ...s };
  } catch { /* storage unavailable or corrupt */ }
  return emptyState();
}

export function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/* ---------- planning today's review ---------- */

// Words due today (oldest first), plus up to NEW_PER_DAY new words (Hard-marked first).
export function planToday(words, state, levels, day = today()) {
  const due = words
    .filter(w => state.cards[w.lower] && state.cards[w.lower].due <= day)
    .sort((a, b) => state.cards[a.lower].due.localeCompare(state.cards[b.lower].due));

  const usedNew = state.newDay === day ? state.newCount : 0;
  const rank = { hard: 0, medium: 1 };
  const fresh = words
    .filter(w => !state.cards[w.lower])
    .map(w => ({ w, r: rank[levels[w.lower]] ?? 2, x: Math.random() }))
    .sort((a, b) => a.r - b.r || a.x - b.x)
    .slice(0, Math.max(0, NEW_PER_DAY - usedNew))
    .map(o => o.w);

  return { due, fresh };
}

export function stats(words, state, day = today()) {
  let learned = 0, dueToday = 0, dueTomorrow = 0;
  const tomorrow = addDays(day, 1);
  for (const w of words) {
    const c = state.cards[w.lower];
    if (!c) continue;
    learned++;
    if (c.due <= day) dueToday++;
    else if (c.due === tomorrow) dueTomorrow++;
  }
  return { learned, dueToday, dueTomorrow, total: words.length };
}

/* ---------- rating a card ---------- */

// Next step on the ladder for a rating. `lapsedNow` = forgotten earlier in this
// session, so a correct answer only earns a short gap.
export function nextStep(card, rating, { lapsedNow = false } = {}) {
  const step = card ? card.step : -1;
  if (rating === 'forgot') return 0;
  if (lapsedNow) return rating === 'good' ? 1 : 0;
  if (rating === 'hard') return Math.max(1, step);
  return Math.min(Math.max(step + 1, 2), LADDER.length - 1); // good
}

// The user's Easy/Medium/Hard mark nudges longer gaps: Hard words come back
// a bit sooner, Easy ones a bit later.
export function intervalDays(step, mark) {
  let days = LADDER[step];
  if (days > 3 && mark === 'hard') days = Math.round(days * 0.75);
  if (days > 3 && mark === 'easy') days = Math.round(days * 1.25);
  return days;
}

export function rate(state, word, rating, { lapsedNow = false, mark = null, day = today() } = {}) {
  const card = state.cards[word.lower];
  const step = nextStep(card, rating, { lapsedNow });
  const days = intervalDays(step, mark);
  const isNew = !card;
  const sameDay = state.newDay === day;
  return {
    ...state,
    cards: {
      ...state.cards,
      [word.lower]: {
        step,
        due: addDays(day, days),
        reps: (card?.reps || 0) + 1,
        lapses: (card?.lapses || 0) + (rating === 'forgot' ? 1 : 0),
        last: day,
      },
    },
    newDay: isNew ? day : state.newDay,
    newCount: isNew ? (sameDay ? state.newCount : 0) + 1 : state.newCount,
  };
}

export function describeDays(days) {
  if (days === 1) return 'tomorrow';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const w = Math.round(days / 7);
    return w === 1 ? '1 week' : `${w} weeks`;
  }
  const m = Math.round(days / 30);
  return m === 1 ? '1 month' : `${m} months`;
}
