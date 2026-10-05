import { sinceLabel } from '../repeat.js';

// Toggles a word on/off the repeat list. `compact` shows just the icon (Browse rows).
export default function RepeatButton({ active, since, onToggle, compact = false, showKey = false }) {
  const title = active
    ? `On your repeat list (${sinceLabel(since)}) — click to remove`
    : 'Add to your repeat list';
  return (
    <button
      type="button"
      className={`repeat-btn ${active ? 'active' : ''} ${compact ? 'compact' : ''}`}
      aria-pressed={active}
      title={title}
      onClick={e => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <span aria-hidden="true">🔁</span>
      {!compact && (
        <span>
          {active ? `Repeating · ${sinceLabel(since)}` : 'Repeat this word'}
          {showKey && <kbd>R</kbd>}
        </span>
      )}
    </button>
  );
}
