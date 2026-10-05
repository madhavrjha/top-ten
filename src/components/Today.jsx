// Home-screen section with today's two tasks and their saved progress.
export default function Today({
  letters, letter, letterWords, letterDone, onLetterChange, onStartLetter, shuffleLetter, onShuffleChange,
  masteredCount, reviewDue, reviewDone, nextDue, onStartReview, hasProgress, onClear,
}) {
  const letterCount = letterWords.length;
  const letterFinished = letterCount > 0 && letterDone >= letterCount;

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
          <span className="task-name">✅ Mastered review</span>
          <span className="muted small-text">{reviewDone} / {reviewDone + reviewDue} words</span>
        </div>
        {masteredCount === 0 ? (
          <p className="muted small-text">
            No Mastered words yet. When a word is all clear, set its stage to ✅ Mastered and it will come back here
            for spaced reviews.
          </p>
        ) : (
          <>
            <p className="muted small-text">
              {reviewDue
                ? `${reviewDue} word${reviewDue === 1 ? '' : 's'} due. Each one you remember comes back later than last time.`
                : `Nothing due right now${nextDue ? ` · next ${nextDue}` : ''}.`}
            </p>
            <button className={reviewDue ? 'primary' : 'ghost'} disabled={!reviewDue} onClick={onStartReview}>
              {reviewDue ? (reviewDone ? 'Continue review' : 'Start review') : '✓ Done for today'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
