// Loads every src/words/<letter>.json file (each is an array of words).
// Add a new letter file and it's picked up automatically.
import { prepareWords } from './utils.js';

const files = import.meta.glob('./words/*.json', { eager: true, import: 'default' });

export const WORDS = prepareWords(Object.values(files).flat());
