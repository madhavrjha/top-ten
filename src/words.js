// Loads every src/words/<letter>.json file (each is an array of words).
// Add a new letter file and it's picked up automatically.
import { prepareWords } from './utils.js';
import FREQUENCY from './frequency.json';
import { SOURCES } from './shows.js';

const files = import.meta.glob('./words/*.json', { eager: true, import: 'default' });

// `sources`: the shows a word was picked from (see shows.js), [] for most words.
export const WORDS = prepareWords(Object.values(files).flat(), FREQUENCY)
  .map(w => ({ ...w, sources: SOURCES[w.lower] || [] }));
