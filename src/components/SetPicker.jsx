import { STAGES } from '../stages.js';
import { makeSetId, filterWords } from '../sets.js';

// Two chip rows that combine: a stage (or all stages) and a letter (or all
// letters). Counts show how many words each chip would give with the other row's choice.
export default function SetPicker({ words, stageOf, letters, stage, letter, onChange }) {
  const count = (s, l) => filterWords(words, stageOf, s, l).length;
  const chip = (key, label, active, n, onClick, extra = '') => (
    <button key={key} className={`set-chip ${extra} ${active ? 'active' : ''}`} aria-pressed={active} onClick={onClick}>
      <span>{label}</span>
      <span className="count">{n}</span>
    </button>
  );
  return (
    <div className="set-rows">
      <div className="set-picker" role="group" aria-label="Stage">
        {chip('all', 'All stages', !stage, count(null, letter), () => onChange(makeSetId(null, letter)))}
        {STAGES.map(s => chip(s.id, `${s.icon} ${s.label}`, stage === s.id, count(s.id, letter),
          () => onChange(makeSetId(s.id, letter)), 'stage'))}
      </div>
      <div className="set-picker" role="group" aria-label="Letter">
        {chip('all', 'All letters', !letter, count(stage, null), () => onChange(makeSetId(stage, null)))}
        {letters.map(l => chip(l, l.toUpperCase(), letter === l, count(stage, l), () => onChange(makeSetId(stage, l))))}
      </div>
    </div>
  );
}
