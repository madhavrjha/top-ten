import { FILTERS, matchesFilter } from '../levels.js';

// Any / Unmarked / Easy / Medium / Hard chips with counts for the given words.
export default function LevelFilter({ words, levels, value, onChange }) {
  return (
    <div className="set-picker">
      {FILTERS.map(f => {
        const count = f.id === 'any'
          ? words.length
          : words.reduce((n, w) => n + (matchesFilter(levels[w.lower], f.id) ? 1 : 0), 0);
        return (
          <button
            key={f.id}
            className={`set-chip ${f.id} ${value === f.id ? 'active' : ''}`}
            onClick={() => onChange(f.id)}
            aria-pressed={value === f.id}
          >
            {f.id !== 'any' && f.id !== 'unmarked' && <span className={`dot ${f.id}`} />}
            <span>{f.label}</span>
            <span className="count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
