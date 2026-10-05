// Saved "Spell the word" progress, one entry per set ('all', 'repeat', 'a', ...),
// in localStorage key vocab.spell. Removed when a set is cleared or restarted.
const KEY = 'vocab.spell';

function loadAll() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

function saveAll(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage unavailable */ }
}

export function loadSpell(setId) {
  return loadAll()[setId] || null;
}

export function saveSpell(setId, data) {
  saveAll({ ...loadAll(), [setId]: data });
}

export function clearSpell(setId) {
  const all = loadAll();
  if (!(setId in all)) return;
  delete all[setId];
  saveAll(all);
}
