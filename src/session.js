// Pure quiz-session logic: the chosen set is shuffled, missed words come back
// a few questions later, and the session ends when every word is answered right.
import { shuffle } from './utils.js';

const OPTION_COUNT = 4;

// setWords: the words being practiced. allWords: used for Level 1 distractors
// and same-meaning answers in Level 2. Level 3 skips words whose examples
// don't contain the word.
export function newSession(setWords, allWords, level) {
  if (level === 3) setWords = setWords.filter(w => findClozes(w).length > 0);
  return nextQuestion({
    words: allWords,
    byMeaning: groupByMeaning(allWords),
    total: setWords.length,
    level,
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
    options: s.level === 1 ? buildOptions(current, s.words) : null,
    cloze: s.level === 3 ? pickRandom(findClozes(current)) : null,
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

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function groupByMeaning(words) {
  const map = new Map();
  for (const w of words) {
    const list = map.get(w.key);
    list ? list.push(w.lower) : map.set(w.key, [w.lower]);
  }
  return map;
}

// Distractors must have distinct meanings so there's only one right answer.
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

// Level 3: finds the word (or a different form of it) inside each example
// sentence and returns the sentence split around it, e.g. for "brunt of":
// { before: 'The towns bore the ', answer: 'brunt of', after: ' the storm.' }
export function findClozes(word) {
  const target = stemPhrase(word.lower);
  const n = word.lower.split(/\s+/).length;
  const out = [];
  for (const sentence of word.examples) {
    const tokens = [...sentence.matchAll(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)];
    for (let i = 0; i + n <= tokens.length; i++) {
      const start = tokens[i].index;
      const last = tokens[i + n - 1];
      const end = last.index + last[0].length;
      const text = sentence.slice(start, end);
      if (stemPhrase(text.toLowerCase()) === target) {
        out.push({ before: sentence.slice(0, start), answer: text, after: sentence.slice(end) });
        break;
      }
    }
  }
  return out;
}

// Level 3 answer check against the blanked text: 'exact', 'form' or 'wrong'.
export function checkCloze(typed, s) {
  const t = typed.trim().toLowerCase().replace(/\s+/g, ' ');
  const answer = s.cloze.answer.toLowerCase();
  if (t === answer) return 'exact';
  if (stemPhrase(t) === stemPhrase(answer)) return 'form';
  return 'wrong';
}
