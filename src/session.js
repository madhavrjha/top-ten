// Pure quiz-session logic: the chosen set is shuffled, missed words come back
// a few questions later, and the session ends when every word is answered right.
import { shuffle } from './utils.js';

// setWords: the words being practiced. allWords: used to accept another word
// with the exact same meaning as a correct answer.
export function newSession(setWords, allWords) {
  return nextQuestion({
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
