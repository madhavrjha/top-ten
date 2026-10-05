import { STAGE_IDS, stageInfo } from '../stages.js';

// Chip rows for choosing "All", a stage, or a single letter.
export default function SetPicker({ sets, value, onChange }) {
  const label = x => {
    if (x.id === 'all') return 'All';
    if (STAGE_IDS.includes(x.id)) return `${stageInfo(x.id).icon} ${stageInfo(x.id).label}`;
    return x.id.toUpperCase();
  };
  return (
    <div className="set-picker">
      {sets.map((x, i) => (
        <span key={x.id} className="chip-wrap">
          {i > 0 && STAGE_IDS.includes(sets[i - 1].id) && !STAGE_IDS.includes(x.id) && <span className="chip-break" />}
          <button
            className={`set-chip ${STAGE_IDS.includes(x.id) ? 'stage' : ''} ${x.id === value ? 'active' : ''}`}
            onClick={() => onChange(x.id)}
            aria-pressed={x.id === value}
          >
            <span>{label(x)}</span>
            <span className="count">{x.words.length}</span>
          </button>
        </span>
      ))}
    </div>
  );
}
