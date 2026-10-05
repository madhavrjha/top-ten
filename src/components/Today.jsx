import { REPEAT_ROUNDS } from '../daily.js';

// Home-screen section with today's two tasks and their saved progress.
export default function Today({
  letters, letter, letterWords, letterDone, onLetterChange, onStartLetter, shuffleLetter, onShuffleChange,
  repeatWords, rounds, roundDone, onStartRepeat, onClear,
}) {
  const letterCount = letterWords.length;
  const letterFinished = letterCount > 0 && letterDone >= letterCount;
  const repeatFinished = rounds >= REPEAT_ROUNDS;
  const hasProgress = letterDone > 0 || rounds > 0 || roundDone > 0;

  return (
    <div className="today">
      <div className="today-head">
        <h2 className="section-title">Today</h2>
        <button type="button" className="link-btn" disabled={!hasProgress} onClick={onClear}>
          Clear today's progress
        </button>
      </div>

      <div className="task">
        <div className="task-top">
          <span className="task-name">📖 Letter of the day</span>
          <span className="muted small-text">{letterDone} / {letterCount} words</span>
        </div>
        <div className="letter-pick">
          {letters.map(l => (
            <button
              key={l}
              className={`set-chip ${l === letter ? 'active' : ''}`}
              aria-pressed={l === letter}
              onClick={() => onLetterChange(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="bar"><div className="bar-fill" style={{ width: `${(letterDone / Math.max(1, letterCount)) * 100}%` }} /></div>
        <div className="order-pick" role="group" aria-label="Word order">
          <span className="muted small-text">Order:</span>
          <button className={`set-chip ${!shuffleLetter ? 'active' : ''}`} aria-pressed={!shuffleLetter}
            onClick={() => onShuffleChange(false)}>A–Z</button>
          <button className={`set-chip ${shuffleLetter ? 'active' : ''}`} aria-pressed={shuffleLetter}
            onClick={() => onShuffleChange(true)}>🔀 Shuffle</button>
        </div>
        <button className={letterFinished ? 'ghost' : 'primary'} disabled={!letterCount} onClick={onStartLetter}>
          {letterFinished ? `✓ Letter ${letter.toUpperCase()} done` : letterDone ? 'Continue' : `Start letter ${letter.toUpperCase()}`}
        </button>
      </div>

      <div className="task">
        <div className="task-top">
          <span className="task-name">🔁 Repeat words · {REPEAT_ROUNDS}× a day</span>
          <span className="rounds" aria-label={`${rounds} of ${REPEAT_ROUNDS} rounds done`}>
            {Array.from({ length: REPEAT_ROUNDS }, (_, i) => (
              <span key={i} className={`round-dot ${i < rounds ? 'on' : ''}`} />
            ))}
          </span>
        </div>
        {repeatWords.length === 0 ? (
          <p className="muted small-text">
            Your repeat list is empty. Tap 🔁 on words you forget while going through a letter.
          </p>
        ) : (
          <>
            <p className="muted small-text">
              {repeatFinished
                ? `All ${REPEAT_ROUNDS} rounds done today.`
                : `Round ${rounds + 1} of ${REPEAT_ROUNDS} · ${roundDone} / ${repeatWords.length} words`}
            </p>
            <button className={repeatFinished ? 'ghost' : 'primary'} disabled={repeatFinished} onClick={onStartRepeat}>
              {repeatFinished ? '✓ Done for today' : roundDone ? 'Continue round' : `Start round ${rounds + 1}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
