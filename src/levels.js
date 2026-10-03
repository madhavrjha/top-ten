export const LEVELS = [
  { id: 'easy', label: 'Easy', key: 'e' },
  { id: 'medium', label: 'Medium', key: 'm' },
  { id: 'hard', label: 'Hard', key: 'h' },
];

export const FILTERS = [
  { id: 'any', label: 'Any' },
  { id: 'unmarked', label: 'Unmarked' },
  ...LEVELS,
];

// Saving needs the dev server (npm run dev); a static build is read-only.
export const CAN_SAVE = import.meta.env.DEV;

export function matchesFilter(level, filter) {
  if (filter === 'any') return true;
  if (filter === 'unmarked') return !level;
  return level === filter;
}

export async function saveLevel(word, level) {
  const res = await fetch('/api/level', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, level }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || `HTTP ${res.status}`);
  }
}
