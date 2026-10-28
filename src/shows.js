// Word lists from shows (src/shows/<slug>.json = { title, icon, words: [{ word, line }] }).
// `word` matches an entry in src/words; `line` is the subtitle it was heard in. Shows are
// browsed through the Source filter (sets.js).
const files = import.meta.glob('./shows/*.json', { eager: true, import: 'default' });

// One entry per show, for the Source filter. `id` is the slug without "-" (that
// character separates groups in set ids, see sets.js): "demon-slayer" → "demonslayer".
export const SHOW_LIST = Object.entries(files).map(([path, show]) => {
  const slug = path.match(/([^/]+)\.json$/)[1];
  return { id: slug.replace(/[^a-z0-9]/g, ''), slug, title: show.title, icon: show.icon || '🎬' };
});
export const SOURCE_IDS = SHOW_LIST.map(s => s.id);
export const sourceInfo = id => SHOW_LIST.find(s => s.id === id) || null;

// Where each word comes from: { "<lower>": [{ id, slug, title, icon, line }] }.
export const SOURCES = {};
Object.values(files).forEach((show, i) => {
  for (const x of show.words) {
    (SOURCES[x.word.toLowerCase()] ||= []).push({ ...SHOW_LIST[i], line: x.line });
  }
});

