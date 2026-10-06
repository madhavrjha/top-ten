// Practice sets: any mix of a stage, a letter and a rarity, or none ("all").
// The set id is used in URLs and saved progress, parts joined by "-":
// all | recall | b | common | recall-b | recall-b-common.
import { STAGE_IDS, stageInfo } from './stages.js';
import { RARITY_IDS, rarityInfo } from './rarity.js';

export function makeSetId(stage, letter, rarity) {
  return [stage, letter, rarity].filter(Boolean).join('-') || 'all';
}

// → { stage, letter, rarity } (each may be null), or null if the id isn't valid.
export function parseSetId(id, letters) {
  const out = { stage: null, letter: null, rarity: null };
  if (id === 'all') return out;
  for (const part of (id || '').split('-')) {
    if (!out.stage && STAGE_IDS.includes(part)) out.stage = part;
    else if (!out.letter && letters.includes(part)) out.letter = part;
    else if (!out.rarity && RARITY_IDS.includes(part)) out.rarity = part;
    else return null;
  }
  return makeSetId(out.stage, out.letter, out.rarity) === id ? out : null;
}

export function setLabel(stage, letter, rarity) {
  const parts = [
    stage && stageInfo(stage).label,
    letter && `Letter ${letter.toUpperCase()}`,
    rarity && rarityInfo(rarity).label,
  ].filter(Boolean);
  return parts.join(' · ') || 'All words';
}

// words: all words; stageOf(word) → stage id.
export function filterWords(words, stageOf, { stage, letter, rarity }) {
  return words.filter(w =>
    (!letter || w.word[0].toLowerCase() === letter)
    && (!rarity || w.rarity === rarity)
    && (!stage || stageOf(w) === stage));
}

export function buildSet(id, words, stageOf, letters) {
  const p = parseSetId(id, letters);
  if (!p) return null;
  return { id, ...p, label: setLabel(p.stage, p.letter, p.rarity), words: filterWords(words, stageOf, p) };
}
