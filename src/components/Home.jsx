import SetPicker from './SetPicker.jsx';
import VoicePicker from './VoicePicker.jsx';
import Today from './Today.jsx';
import { stageInfo } from '../stages.js';

export default function Home({
  picker, onSetChange, practiceSet, quizSaved, onPick, today, onClearToday, onClearData, dataVersion, hasWords,
}) {
  const count = practiceSet.words.length;

  return (
    <section>
      {!hasWords && <p className="bad-text">No words found. Add words to src/words/&lt;letter&gt;.json.</p>}

      {hasWords && <Today {...today} />}

      <h2 className="section-title spaced">Practice set</h2>
      <SetPicker {...picker} stage={practiceSet.stage} letter={practiceSet.letter} onChange={onSetChange} />
      <p className="muted small-text">
        {`${practiceSet.label}: ${count} word${count === 1 ? '' : 's'}.`}
        {practiceSet.stage && ` ${stageInfo(practiceSet.stage).hint}`}
      </p>

      <div className="levels">
        <button className="level-card" disabled={!count} onClick={() => onPick('pick')}>
          <span className="level-num">Practice · multiple choice</span>
          <strong>{quizSaved.pick ? `Resume · ${quizSaved.pick.cleared} cleared` : 'Pick the meaning'}</strong>
          <span className="muted">
            {quizSaved.pick
              ? `${quizSaved.pick.remaining.length} word${quizSaved.pick.remaining.length === 1 ? '' : 's'} left in ${practiceSet.label}. Progress is saved after every answer.`
              : 'See the word, choose its meaning from 4. Missed words come back until every word is cleared.'}
          </span>
        </button>
        <button className="level-card" disabled={!count} onClick={() => onPick('spell')}>
          <span className="level-num">Practice · spelling</span>
          <strong>{quizSaved.spell ? `Resume spelling · ${quizSaved.spell.cleared} cleared` : 'Spell the word'}</strong>
          <span className="muted">
            {quizSaved.spell
              ? `${quizSaved.spell.remaining.length} word${quizSaved.spell.remaining.length === 1 ? '' : 's'} left in ${practiceSet.label}. Progress is saved after every answer.`
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
        <div className="row-left">
          <button type="button" className="ghost" onClick={onClearToday}>Clear today's progress</button>
          <button type="button" className="ghost danger" onClick={onClearData}>Clear all saved data</button>
        </div>
      </div>
    </section>
  );
}
