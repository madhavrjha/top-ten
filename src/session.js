// Pure quiz-session logic: the chosen set is shuffled, missed words come back
// a few questions later, and the session ends when every word is answered right.
import { shuffle } from './utils.js';

const OPTION_COUNT = 4;

// setWords: the words being practiced. allWords: used to accept another word
// with the exact same meaning as a correct answer, and for the wrong options
// in 'pick' mode (pick the meaning). mode: 'spell' | 'pick'.
export function newSession(setWords, allWords, mode = 'spell') {
  return nextQuestion({
    mode,
    words: allWords,
    byMeaning: groupByMeaning(allWords),
    total: setWords.length,
    queue: shuffle(setWords),
    cleared: 0,
    qid: 0,
  });
}

export function nextQuestion(s) {
  if (!s.queue.length) return { ...s, phase: 'done', current: null };
  const [current, ...queue] = s.queue;
  return {
    ...s,
    current,
    queue,
    qid: s.qid + 1,
    phase: 'question',
    result: null,
    options: s.mode === 'pick' ? buildOptions(current, s.words) : null,
  };
}

export function answer(s, correct, extra = {}) {
  let queue = s.queue;
  if (!correct) {
    // Put the missed word back a few spots later so it comes around again.
    const pos = Math.min(queue.length, 2 + Math.floor(Math.random() * 3));
    queue = [...queue.slice(0, pos), s.current, ...queue.slice(pos)];
  }
  return {
    ...s,
    queue,
    cleared: s.cleared + (correct ? 1 : 0),
    phase: 'answered',
    result: { correct, ...extra },
  };
}

function groupByMeaning(words) {
  const map = new Map();
  for (const w of words) {
    const list = map.get(w.key);
    list ? list.push(w.lower) : map.set(w.key, [w.lower]);
  }
  return map;
}

// Wrong options must have different meanings so there's only one right answer.
// Picks random words instead of shuffling the whole list, so it stays fast
// no matter how many words there are.
function buildOptions(w, words) {
  const seen = new Set([w.key]);
  const others = [];
  for (let tries = 0; others.length < OPTION_COUNT - 1 && tries < 200; tries++) {
    const x = words[Math.floor(Math.random() * words.length)];
    if (!seen.has(x.key)) {
      seen.add(x.key);
      others.push(x);
    }
  }
  return shuffle([w, ...others]);
}

// Returns 'exact', 'form' (right word, different form — e.g. amplify for
// amplifies), or 'wrong'. Words with the exact same meaning count as exact.
export function checkSpelling(typed, s) {
  const t = typed.trim().toLowerCase();
  const targets = s.byMeaning.get(s.current.key) || [s.current.lower];
  if (targets.includes(t)) return 'exact';
  const typedStem = stemPhrase(t);
  if (targets.some(w => stemPhrase(w) === typedStem)) return 'form';
  return 'wrong';
}

// Light stemmer: strips common inflections/suffixes so different forms of
// the same word compare equal (amplifies/amplify, amputation/amputated).
const SUFFIXES = [
  ['ically', 'ic'], ['ations', 'ate'], ['ation', 'ate'], ['ments', ''], ['ment', ''],
  ['nesses', ''], ['ness', ''], ['ingly', ''], ['ings', ''], ['ing', ''],
  ['ably', 'able'], ['ibly', 'ible'], ['ied', 'y'], ['ies', 'y'], ['ily', 'y'],
  ['ly', ''], ['ed', ''], ['es', ''], ['s', ''],
];

export function stem(word) {
  let w = word.toLowerCase();
  for (const [suf, rep] of SUFFIXES) {
    if (w.endsWith(suf) && w.length - suf.length >= 2) {
      w = w.slice(0, -suf.length) + rep;
      break;
    }
  }
  w = w.replace(/e$/, '');                          // amputate → amputat
  w = w.replace(/([b-df-hj-np-tv-z])\1$/, '$1');   // acquitt → acquit
  w = w.replace(/i$/, 'y');                         // amplifi → amplify
  return w;
}

function stemPhrase(p) {
  return p.split(/[\s-]+/).filter(Boolean).map(stem).join(' ');
}

// Saved progress: the words still to answer (in order) and the cleared count.
export function serializeSession(s) {
  const remaining = s.phase === 'question' ? [s.current, ...s.queue] : s.queue;
  return { remaining: remaining.map(w => w.lower), cleared: s.cleared };
}

// Continues saved progress. Words no longer in the set are dropped; returns
// null if nothing is left to answer.
export function resumeSession(saved, setWords, allWords, mode = 'spell') {
  const byLower = new Map(setWords.map(w => [w.lower, w]));
  const queue = (saved?.remaining || []).map(l => byLower.get(l)).filter(Boolean);
  if (!queue.length) return null;
  const cleared = Math.max(0, saved.cleared || 0);
  return nextQuestion({
    mode,
    words: allWords,
    byMeaning: groupByMeaning(allWords),
    total: cleared + new Set(queue.map(w => w.lower)).size,
    queue,
    cleared,
    qid: 0,
  });
}
