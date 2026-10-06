import { rarityOf } from './rarity.js';

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

// Normalizes raw word entries once at load time and precomputes the
// lowercase word, the meaning key used by the quiz, and how common it is
// (frequency: { "<lower>": Zipf score }).
export function prepareWords(list, frequency = {}) {
  return list
    .filter(w => w && w.word && w.meaning)
    .map(w => {
      const word = w.word.trim();
      const meaning = w.meaning.trim();
      return {
        word,
        meaning,
        memory: (w.memory || '').trim(),
        hindi: (w.hindi || '').trim(),
        trick: (w.trick || '').trim(),
        examples: Array.isArray(w.examples) ? w.examples : [],
        usage: w.usage && w.usage.pattern ? {
          pos: w.usage.pos || '',
          pattern: w.usage.pattern,
          partners: Array.isArray(w.usage.partners) ? w.usage.partners : [],
        } : null,
        lower: word.toLowerCase(),
        key: norm(meaning),
        freq: frequency[word.toLowerCase()] ?? null,
        rarity: rarityOf(frequency[word.toLowerCase()]),
      };
    })
    .sort((a, b) => a.word.localeCompare(b.word));
}

// Local date as YYYY-MM-DD.
export function today(date = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

// Whole days from one YYYY-MM-DD date to another (negative if `to` is earlier).
export function daysBetween(from, to) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 864e5);
}

// Removes everything this app saved in the browser (stages, voice, last set, progress).
export function clearSavedData() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith('vocab.')).forEach(k => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}
