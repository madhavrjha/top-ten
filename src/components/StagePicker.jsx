import { STAGES } from '../stages.js';

// Choose a word's stage. Full: a row of five chips (keys 1–5).
// Compact: a small dropdown that shows the stage icon (Browse rows).
export default function StagePicker({ stage, onChange, compact = false, title, showKeys = false }) {
  if (compact) {
    return (
      <select
        className={`stage-select stage-${stage}`}
        value={stage}
        title={title}
        aria-label="Stage"
        onClick={e => e.stopPropagation()}
        onChange={e => onChange(e.target.value)}
      >
        {STAGES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
      </select>
    );
  }
  return (
    <div className="stage-picker" role="group" aria-label="Stage">
      {STAGES.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className={`set-chip ${s.id === stage ? 'active' : ''}`}
          aria-pressed={s.id === stage}
          title={s.hint}
          onClick={() => onChange(s.id)}
        >
          <span aria-hidden="true">{s.icon}</span> {s.label}
          {showKeys && <kbd>{i + 1}</kbd>}
        </button>
      ))}
    </div>
  );
}
