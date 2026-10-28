// Practice sets: a filter over four groups — stages, letters, how common and source (show) —
// where each group can have any number of values picked (none = all).
// The set id is used in URLs and saved progress: groups joined by "-", values
// within a group by ".", always in a fixed order:
// all | recall | a.b | recognise.recall-a.b-common | rare-demonslayer
import { STAGE_IDS, stageInfo } from './stages.js';
import { RARITY_IDS, rarityInfo } from './rarity.js';
import { SOURCE_IDS, sourceInfo } from './shows.js';

export const EMPTY_FILTER = { stage: [], letter: [], rarity: [], source: [] };
const GROUPS = ['stage', 'letter', 'rarity', 'source'];

// Sorts each group into its fixed order so one filter always has one id.
function normalize(filter, letters) {
  const order = { stage: STAGE_IDS, letter: letters, rarity: RARITY_IDS, source: SOURCE_IDS };
  const out = {};
  for (const g of Object.keys(order)) {
    out[g] = order[g].filter(v => (filter[g] || []).includes(v));
  }
  return out;
}

export function makeSetId(filter, letters) {
  const f = normalize(filter, letters);
  return GROUPS.map(g => f[g].join('.')).filter(Boolean).join('-') || 'all';
}

// → filter { stage: [...], letter: [...], rarity: [...] }, or null if the id isn't valid.
export function parseSetId(id, letters) {
  if (id === 'all') return { ...EMPTY_FILTER };
  const groups = { stage: STAGE_IDS, letter: letters, rarity: RARITY_IDS, source: SOURCE_IDS };
  const out = { stage: [], letter: [], rarity: [], source: [] };
  for (const part of (id || '').split('-')) {
    const values = part.split('.');
    const g = Object.keys(groups).find(k => values.every(v => groups[k].includes(v)));
    if (!g || out[g].length) return null;
    out[g] = values;
  }
  return makeSetId(out, letters) === id ? out : null;
}

export function setLabel(filter) {
  const parts = [
    filter.stage.map(s => stageInfo(s).label).join(', '),
    filter.letter.length && `${filter.letter.length > 1 ? 'Letters' : 'Letter'} ${filter.letter.map(l => l.toUpperCase()).join(', ')}`,
    filter.rarity.map(r => rarityInfo(r).label).join(', '),
    filter.source.map(s => `${sourceInfo(s).icon} ${sourceInfo(s).title}`).join(', '),
  ].filter(Boolean);
  return parts.join(' · ') || 'All words';
}

export function isFiltered(filter) {
  return GROUPS.some(g => filter[g].length > 0);
}

// words: all words; stageOf(word) → stage id.
export function filterWords(words, stageOf, { stage, letter, rarity, source }) {
  return words.filter(w =>
    (!letter.length || letter.includes(w.word[0].toLowerCase()))
    && (!rarity.length || rarity.includes(w.rarity))
    && (!source.length || w.sources.some(s => source.includes(s.id)))
    && (!stage.length || stage.includes(stageOf(w))));
}

export function buildSet(id, words, stageOf, letters) {
  const filter = parseSetId(id, letters);
  if (!filter) return null;
  return { id, filter, label: setLabel(filter), words: filterWords(words, stageOf, filter) };
}
