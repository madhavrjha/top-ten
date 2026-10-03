import { LEVELS, CAN_SAVE } from '../levels.js';

// Easy / Medium / Hard buttons. Clicking the active level clears it.
export default function LevelPicker({ level, onChange, showKeys = false }) {
  if (!CAN_SAVE) return null;
  return (
    <div className="level-picker" role="group" aria-label="How hard is this word for you?">
      <span className="muted">Mark as:</span>
      {LEVELS.map(l => (
        <button
          key={l.id}
          type="button"
          className={`level-btn ${l.id} ${level === l.id ? 'active' : ''}`}
          aria-pressed={level === l.id}
          onClick={() => onChange(level === l.id ? null : l.id)}
        >
          {l.label}{showKeys && <kbd>{l.key.toUpperCase()}</kbd>}
        </button>
      ))}
    </div>
  );
}
