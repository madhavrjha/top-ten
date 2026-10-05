// The repeat list: words you've chosen to keep revising, saved in this browser
// as { "<lowercase word>": "<date added, YYYY-MM-DD>" }. A word stays on the
// list until you unset it.
const KEY = 'vocab.repeat';

export function loadRepeat() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

export function saveRepeat(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

export function today() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// "today", "1 day", "5 days" since a YYYY-MM-DD date.
export function sinceLabel(day) {
  if (!day) return '';
  const [y, m, d] = day.split('-').map(Number);
  const now = new Date();
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(y, m - 1, d)) / 864e5);
  if (days <= 0) return 'today';
  return days === 1 ? '1 day' : `${days} days`;
}

// Removes everything this app saved in the browser (repeat list, voice, last set).
export function clearSavedData() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith('vocab.')).forEach(k => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}
