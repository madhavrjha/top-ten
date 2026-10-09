import { useEffect, useRef, useState } from 'react';
import { shuffle } from '../utils.js';
import { speak } from '../speech.js';
import { LEARN_ROUNDS, roundsToday, isLearningToday, isDueSet, statusOf } from '../studySets.js';
import WordDetails from './WordDetails.jsx';
import SpeakButton from './SpeakButton.jsx';

// One round through a study set: see the word, say its meaning, check it, then
// Knew it / Forgot. Forgotten words come back at the end of the round, so a
// round ends only when every word was known once.
export default function SetStudy({ set, rec, onRoundDone, onBack, onAllSets }) {
  const [roundId, setRoundId] = useState(0);
  const [queue, setQueue] = useState(() => shuffle(set.words));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [missed, setMissed] = useState(() => new Set());
  const reported = useRef(false);

  const current = queue[index];
  const finished = !current;
  const knownCount = index - (queue.length - set.words.length); // words cleared this round

  // Report a finished round once.
  useEffect(() => {
    if (finished && !reported.current) {
      reported.current = true;
      onRoundDone(set.number);
    }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const newRound = () => {
    setQueue(shuffle(set.words));
    setIndex(0);
    setRevealed(false);
    setMissed(new Set());
    reported.current = false;
    setRoundId(i => i + 1);
  };

  const answer = knew => {
    if (!current) return;
    if (!knew) {
      setQueue(q => [...q, current]);
      setMissed(m => new Set(m).add(current.lower));
    }
    setIndex(i => i + 1);
    setRevealed(false);
  };

  // Space / Enter = show meaning; then Enter = knew it, F = forgot; P = pronounce.
  useEffect(() => {
    const onKey = e => {
      if (!current || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
        e.preventDefault();
        setRevealed(true);
      } else if (e.key === 'Enter' && revealed) {
        e.preventDefault();
        answer(true);
      } else if (key === 'f' && revealed) {
        answer(false);
      } else if (key === 'p') {
        speak(current.word);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // What this round is: learning round k of 3, today's review, or an extra round.
  const done = roundsToday(rec);
  const label = isLearningToday(rec)
    ? `Round ${Math.min(done + (finished ? 0 : 1), LEARN_ROUNDS)} of ${LEARN_ROUNDS}`
    : isDueSet(rec) ? 'Review' : 'Extra round';

  if (finished) {
    const learning = isLearningToday(rec);
    const moreToLearn = learning && done < LEARN_ROUNDS;
    const status = statusOf(rec);
    return (
      <section className="card center set-done">
        <h2>{status === 'completed' ? `Set ${set.number} completed! 🎉` : `Set ${set.number} · round done ✓`}</h2>
        <p className="muted">
          {moreToLearn
            ? `Round ${done} of ${LEARN_ROUNDS} today. Go again while it's fresh.`
            : learning
              ? `You learned it today (${done} rounds). It comes back tomorrow for its first review.`
              : status === 'completed'
                ? 'All five reviews done. It stays in your Completed sets.'
                : 'Review done. It comes back later than last time.'}
        </p>
        {missed.size > 0 && (
          <p className="small-text">Forgot this round: <strong>{set.words.filter(w => missed.has(w.lower)).map(w => w.word).join(', ')}</strong></p>
        )}
        <div className="row">
          <button className="ghost" onClick={onBack}>Home</button>
          <button className="ghost" onClick={onAllSets}>All sets</button>
          <button className={moreToLearn ? 'primary' : 'ghost'} autoFocus onClick={newRound}>
            {moreToLearn ? `Start round ${done + 1}` : 'Go again'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section key={roundId}>
      <div className="progress-row">
        <span>📚 Set {set.number} · {label}</span>
        <span className="muted">{knownCount} / {set.words.length} known</span>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${(knownCount / set.words.length) * 100}%` }} />
      </div>

      <div className="card">
        <div className="muted small">Say the meaning, then check</div>
        <div className="prompt word-title">{current.word} <SpeakButton text={current.word} /></div>
        {missed.has(current.lower) && <p className="small-text again">↺ Again: you forgot this one earlier</p>}

        {revealed ? (
          <>
            <div className="walk-back"><WordDetails word={current} showTitle={false} /></div>
            <div className="walk-actions">
              <button className="ghost danger" onClick={() => answer(false)}>Forgot <kbd>F</kbd></button>
              <button className="primary" autoFocus onClick={() => answer(true)}>Knew it <kbd>↵</kbd></button>
            </div>
          </>
        ) : (
          <button className="ghost wide" autoFocus onClick={() => setRevealed(true)}>
            Show meaning <kbd>Space</kbd>
          </button>
        )}
      </div>

      <div className="quiz-actions">
        <button className="ghost" onClick={onBack}>← Home</button>
        <button className="link-btn" onClick={onAllSets}>All sets</button>
      </div>
    </section>
  );
}
