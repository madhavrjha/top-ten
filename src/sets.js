// Practice sets: a stage, a letter, both, or neither ("all"). The set id is
// used in URLs and saved progress: all | recall | b | recall-b.
import { STAGE_IDS, stageInfo } from './stages.js';

export function makeSetId(stage, letter) {
  return [stage, letter].filter(Boolean).join('-') || 'all';
}

// → { stage, letter } (either may be null), or null if the id isn't valid.
export function parseSetId(id, letters) {
  if (id === 'all') return { stage: null, letter: null };
  const out = { stage: null, letter: null };
  for (const part of (id || '').split('-')) {
    if (!out.stage && STAGE_IDS.includes(part)) out.stage = part;
    else if (!out.letter && letters.includes(part)) out.letter = part;
    else return null;
  }
  return makeSetId(out.stage, out.letter) === id ? out : null;
}

export function setLabel(stage, letter) {
  const parts = [stage && stageInfo(stage).label, letter && `Letter ${letter.toUpperCase()}`].filter(Boolean);
  return parts.join(' · ') || 'All words';
}

// words: all words; stageOf(word) → stage id.
export function filterWords(words, stageOf, stage, letter) {
  return words.filter(w =>
    (!letter || w.word[0].toLowerCase() === letter) && (!stage || stageOf(w) === stage));
}

export function buildSet(id, words, stageOf, letters) {
  const p = parseSetId(id, letters);
  if (!p) return null;
  return { id, ...p, label: setLabel(p.stage, p.letter), words: filterWords(words, stageOf, p.stage, p.letter) };
}
