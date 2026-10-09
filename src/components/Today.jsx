import { LEARN_ROUNDS } from '../studySets.js';

// Home-screen section with today's tasks: study sets (learning + reviews +
// a new set) and the Mastered word review.
export default function Today({
  learning, due, nextNew, completed, totalSets, onOpenSet, onAllSets,
  masteredCount, reviewDue, reviewDone, nextDue, onStartReview, hasProgress, onClear,
}) {
  const learningLeft = learning.filter(l => l.rounds < LEARN_ROUNDS);
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
          <span className="task-name">📚 Study sets</span>
          <button type="button" className="link-btn accent" onClick={onAllSets}>
            All sets · {completed}/{totalSets} done →
          </button>
        </div>

        {due.length > 0 && (
          <div className="set-task">
            <span className="small-text"><strong>1. Review</strong> · {due.length} set{due.length === 1 ? '' : 's'} due</span>
            <div className="set-buttons">
              {due.map(n => <button key={n} className="primary" onClick={() => onOpenSet(n)}>Review set {n}</button>)}
            </div>
          </div>
        )}

        {learning.length > 0 && (
          <div className="set-task">
            <span className="small-text"><strong>{due.length ? '2. ' : ''}Learning today</strong> · go through each {LEARN_ROUNDS}×</span>
            <div className="set-buttons">
              {learning.map(l => (
                <button key={l.number} className={l.rounds < LEARN_ROUNDS ? 'primary' : 'ghost'} onClick={() => onOpenSet(l.number)}>
                  Set {l.number} · {l.rounds < LEARN_ROUNDS ? `round ${l.rounds + 1} of ${LEARN_ROUNDS}` : `✓ ${l.rounds} rounds`}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="set-task">
          <span className="small-text">
            <strong>{due.length || learning.length ? 'Next' : 'Start'}: a new set</strong>
            {learningLeft.length ? ' · finish today\'s rounds first' : ' · 20 new words, most common first'}
          </span>
          <div className="set-buttons">
            {nextNew
              ? <button className={due.length || learningLeft.length ? 'ghost' : 'primary'} onClick={() => onOpenSet(nextNew)}>
                  Start set {nextNew}
                </button>
              : <span className="muted small-text">Every set is started. 🎉</span>}
          </div>
        </div>
      </div>

      <div className="task">
        <div className="task-top">
          <span className="task-name">✅ Mastered review</span>
          <span className="muted small-text">{reviewDone} / {reviewDone + reviewDue} words</span>
        </div>
        {masteredCount === 0 ? (
          <p className="muted small-text">
            No Mastered words yet. Set a word's stage to ✅ Mastered and it will come back here for spaced reviews.
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
