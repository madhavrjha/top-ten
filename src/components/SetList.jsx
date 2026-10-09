import { useState } from 'react';
import { STATUSES, statusOf, stepText, isDueSet } from '../studySets.js';
import { rarityInfo } from '../rarity.js';

// All study sets with their status. Filter by status; change a set's status
// from its dropdown; tap a set to study it.
export default function SetList({ sets, progress, onOpen, onStatus, onBack }) {
  const [filter, setFilter] = useState('all');
  const count = id => sets.filter(s => statusOf(progress[s.number]) === id).length;
  const shown = filter === 'all' ? sets : sets.filter(s => statusOf(progress[s.number]) === filter);
  const done = count('completed');

  return (
    <section>
      <div className="row set-list-head">
        <button className="ghost" onClick={onBack}>← Back</button>
        <h2 className="set-list-title">📚 Study sets</h2>
      </div>
      <p className="muted small-text">
        {sets.length} sets of 20, most common words first. {done} completed
        · {sets.length ? Math.round((done / sets.length) * 100) : 0}% of all words.
      </p>
      <div className="bar"><div className="bar-fill" style={{ width: `${(done / Math.max(1, sets.length)) * 100}%` }} /></div>

      <div className="filter-chips status-tabs" role="group" aria-label="Status">
        <button type="button" className={`fchip ${filter === 'all' ? 'on' : ''}`} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          <span className="fchip-label">All</span><span className="fchip-count">{sets.length}</span>
        </button>
        {STATUSES.map(s => (
          <button key={s.id} type="button" className={`fchip ${filter === s.id ? 'on' : ''}`} aria-pressed={filter === s.id}
            onClick={() => setFilter(s.id)}>
            <span className="fchip-icon" aria-hidden="true">{s.icon}</span>
            <span className="fchip-label">{s.label}</span><span className="fchip-count">{count(s.id)}</span>
          </button>
        ))}
      </div>

      <div className="set-rows-list">
        {shown.map(s => {
          const rec = progress[s.number];
          const status = statusOf(rec);
          const due = isDueSet(rec);
          const note = stepText(rec);
          const mix = ['common', 'medium', 'rare'].map(id => [id, s.words.filter(w => w.rarity === id).length]).filter(([, n]) => n);
          return (
            <div key={s.number} className={`set-row status-${status} ${due ? 'due' : ''}`}>
              <button type="button" className="set-row-main" onClick={() => onOpen(s.number)}>
                <span className="set-row-top">
                  <strong>Set {s.number}</strong>
                  <span className="set-mix">
                    {mix.map(([id, n]) => <span key={id} title={rarityInfo(id).label}>{rarityInfo(id).icon}{n}</span>)}
                  </span>
                </span>
                <span className="set-preview muted">{s.words.slice(0, 5).map(w => w.word).join(', ')}…</span>
                {note && <span className={`set-note ${due ? 'due' : ''}`}>{due ? '⏰ ' : ''}{note}</span>}
              </button>
              <select
                className={`set-status status-${status}`}
                value={status}
                aria-label={`Status of set ${s.number}`}
                onChange={e => onStatus(s.number, e.target.value)}
              >
                {STATUSES.map(st => <option key={st.id} value={st.id}>{st.icon} {st.label}</option>)}
              </select>
            </div>
          );
        })}
        {shown.length === 0 && <p className="muted center">No sets here yet.</p>}
      </div>
    </section>
  );
}
