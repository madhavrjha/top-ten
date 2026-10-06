import { STAGES } from '../stages.js';
import { RARITIES } from '../rarity.js';
import { makeSetId, filterWords } from '../sets.js';

// Three chip rows that combine: stage, letter and how common the word is
// (each can be "All"). Counts show how many words each chip would give with
// the other rows' choices.
export default function SetPicker({ words, stageOf, letters, stage, letter, rarity, onChange }) {
  const cur = { stage, letter, rarity };
  const pick = change => {
    const next = { ...cur, ...change };
    return makeSetId(next.stage, next.letter, next.rarity);
  };
  const chip = (key, label, change, extra = '') => {
    const active = Object.entries(change).every(([k, v]) => cur[k] === v);
    const n = filterWords(words, stageOf, { ...cur, ...change }).length;
    return (
      <button key={key} className={`set-chip ${extra} ${active ? 'active' : ''}`} aria-pressed={active}
        onClick={() => onChange(pick(change))}>
        <span>{label}</span>
        <span className="count">{n}</span>
      </button>
    );
  };
  return (
    <div className="set-rows">
      <div className="set-picker" role="group" aria-label="Stage">
        {chip('all', 'All stages', { stage: null })}
        {STAGES.map(s => chip(s.id, `${s.icon} ${s.label}`, { stage: s.id }, 'stage'))}
      </div>
      <div className="set-picker" role="group" aria-label="Letter">
        {chip('all', 'All letters', { letter: null })}
        {letters.map(l => chip(l, l.toUpperCase(), { letter: l }))}
      </div>
      <div className="set-picker" role="group" aria-label="How common">
        {chip('all', 'Any', { rarity: null })}
        {RARITIES.map(r => chip(r.id, `${r.icon} ${r.label}`, { rarity: r.id }))}
      </div>
    </div>
  );
}
