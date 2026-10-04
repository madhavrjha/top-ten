import SetPicker from './SetPicker.jsx';
import LevelFilter from './LevelFilter.jsx';
import VoicePicker from './VoicePicker.jsx';

const CARDS = [
  { id: 1, tag: 'Level 1', title: 'Pick the meaning', text: 'See the word, click the right meaning.' },
  { id: 2, tag: 'Level 2', title: 'Spell the word', text: 'See the meaning, type the exact word. Hints available.' },
];

export default function Home({
  sets, setId, onSetChange, letterWords, levels, filter, onFilterChange,
  practiceCount, practiceLabel, onPick, review, hasWords,
}) {
  return (
    <section>
      {!hasWords && <p className="bad-text">No words found. Add words to src/words/&lt;letter&gt;.json.</p>}

      {review && hasWords && (
        <button className="level-card review-card" onClick={() => onPick('review')}>
          <span className="level-num">Daily review · flashcards</span>
          <strong>
            {review.due + review.fresh === 0
              ? 'All done for today'
              : `${review.due} due · ${review.fresh} new`}
          </strong>
          <span className="muted">
            Recall the meaning, flip the card, rate yourself. Words come back right before you'd forget them.
          </span>
        </button>
      )}

      <h2 className="section-title spaced">Practice set</h2>
      <SetPicker sets={sets} value={setId} onChange={onSetChange} allLabel="All (random)" />

      <h2 className="section-title spaced">Difficulty</h2>
      <LevelFilter words={letterWords} levels={levels} value={filter} onChange={onFilterChange} />

      <p className="muted small-text">
        {practiceCount === 0
          ? 'No words match this set — pick another letter or difficulty.'
          : `${practiceCount} word${practiceCount === 1 ? '' : 's'}, shuffled. A missed word comes back a few questions later — keep going until every word is cleared.`}
      </p>

      <div className="levels">
        {CARDS.map(c => (
          <button key={c.id} className="level-card" disabled={!practiceCount} onClick={() => onPick(c.id)}>
            <span className="level-num">{c.tag}</span>
            <strong>{c.title}</strong>
            <span className="muted">{c.text} · {practiceLabel}</span>
          </button>
        ))}
        <button className="level-card" disabled={!hasWords} onClick={() => onPick('browse')}>
          <span className="level-num">Library</span>
          <strong>Browse all words</strong>
          <span className="muted">Expand a word to see its meaning, trick and examples.</span>
        </button>
      </div>

      <h2 className="section-title spaced">Pronunciation</h2>
      <VoicePicker />
    </section>
  );
}
