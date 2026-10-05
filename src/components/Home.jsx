import SetPicker from './SetPicker.jsx';
import VoicePicker from './VoicePicker.jsx';
import Today from './Today.jsx';
import { STAGE_IDS, stageInfo } from '../stages.js';

export default function Home({
  sets, setId, onSetChange, practiceSet, spellSaved, onPick, today, onClearData, dataVersion, hasWords,
}) {
  const count = practiceSet.words.length;
  const isStage = STAGE_IDS.includes(practiceSet.id);

  return (
    <section>
      {!hasWords && <p className="bad-text">No words found. Add words to src/words/&lt;letter&gt;.json.</p>}

      {hasWords && <Today {...today} />}

      <h2 className="section-title spaced">Practice set</h2>
      <SetPicker sets={sets} value={setId} onChange={onSetChange} />
      <p className="muted small-text">
        {`${practiceSet.label}: ${count} word${count === 1 ? '' : 's'}.`}
        {isStage && ` ${stageInfo(practiceSet.id).hint}`}
      </p>

      <div className="levels">
        <button className="level-card" disabled={!count} onClick={() => onPick('spell')}>
          <span className="level-num">Practice</span>
          <strong>{spellSaved ? `Resume spelling · ${spellSaved.cleared} cleared` : 'Spell the word'}</strong>
          <span className="muted">
            {spellSaved
              ? `${spellSaved.remaining.length} word${spellSaved.remaining.length === 1 ? '' : 's'} left in ${practiceSet.label}. Progress is saved after every answer.`
              : 'See the meaning, type the exact word. Missed words come back until every word is cleared.'}
          </span>
        </button>
        <button className="level-card" disabled={!hasWords} onClick={() => onPick('browse')}>
          <span className="level-num">Library</span>
          <strong>Browse words</strong>
          <span className="muted">Go through a letter, expand words to revise, and set each word's stage.</span>
        </button>
      </div>

      <h2 className="section-title spaced">Pronunciation</h2>
      <VoicePicker key={dataVersion} />

      <h2 className="section-title spaced">Saved data</h2>
      <div className="saved-data">
        <p className="muted small-text">
          Word stages, review dates, today's progress, spelling progress, voice and last set are saved in this
          browser only.
        </p>
        <button type="button" className="ghost danger" onClick={onClearData}>Clear saved data</button>
      </div>
    </section>
  );
}
