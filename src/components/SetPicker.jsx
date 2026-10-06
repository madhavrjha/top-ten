import { useState } from 'react';
import { STAGES } from '../stages.js';
import { RARITIES } from '../rarity.js';
import { makeSetId, filterWords, setLabel, isFiltered, EMPTY_FILTER } from '../sets.js';

// Filter panel: pick any number of stages, letters and how-common levels
// (none picked in a group = all). Each chip's count is how many words it
// would add with the other groups' choices. Collapsible to a one-line summary.
export default function SetPicker({ words, stageOf, letters, filter, onChange, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const total = filterWords(words, stageOf, filter).length;
  const filtered = isFiltered(filter);

  const toggle = (group, value) => {
    const cur = filter[group];
    const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
    onChange(makeSetId({ ...filter, [group]: next }, letters));
  };
  const clearGroup = group => onChange(makeSetId({ ...filter, [group]: [] }, letters));

  const groups = [
    { id: 'stage', title: 'Stage', items: STAGES.map(s => ({ id: s.id, label: s.label, icon: s.icon, hint: s.hint })) },
    { id: 'letter', title: 'Letter', items: letters.map(l => ({ id: l, label: l.toUpperCase() })), compact: true },
    { id: 'rarity', title: 'How common', items: RARITIES.map(r => ({ id: r.id, label: r.label, icon: r.icon, hint: r.hint })) },
  ];

  return (
    <div className={`filters ${open ? 'open' : ''}`}>
      <div className="filters-head">
        <button type="button" className="filters-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <svg className="filters-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="filters-summary">
            <strong>{filtered ? setLabel(filter) : 'All words'}</strong>
            <span className="muted">{total} word{total === 1 ? '' : 's'}</span>
          </span>
          <svg className="chevron" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {filtered && (
          <button type="button" className="link-btn filters-clear" onClick={() => onChange(makeSetId(EMPTY_FILTER, letters))}>
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="filters-body">
          {groups.map(g => (
            <div key={g.id} className="filter-group" role="group" aria-label={g.title}>
              <div className="filter-title">
                <span>{g.title}</span>
                {filter[g.id].length > 0
                  ? <button type="button" className="link-btn" onClick={() => clearGroup(g.id)}>Any</button>
                  : <span className="filter-any">Any</span>}
              </div>
              <div className={`filter-chips ${g.compact ? 'compact' : ''}`}>
                {g.items.map(item => {
                  const on = filter[g.id].includes(item.id);
                  // How many words this chip covers with the other groups' choices.
                  const n = filterWords(words, stageOf, { ...filter, [g.id]: [item.id] }).length;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`fchip ${on ? 'on' : ''} ${n === 0 ? 'empty' : ''}`}
                      aria-pressed={on}
                      title={item.hint}
                      onClick={() => toggle(g.id, item.id)}
                    >
                      {item.icon && <span className="fchip-icon" aria-hidden="true">{item.icon}</span>}
                      <span className="fchip-label">{item.label}</span>
                      <span className="fchip-count">{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
