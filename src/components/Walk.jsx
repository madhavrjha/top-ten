import { useEffect, useState } from 'react';
import { shuffle } from '../utils.js';
import { speak } from '../speech.js';
import { STAGE_IDS, stageOf } from '../stages.js';
import WordDetails from './WordDetails.jsx';
import SpeakButton from './SpeakButton.jsx';
import StagePicker from './StagePicker.jsx';

// Goes through words one card at a time: see the word, try to recall it,
// reveal the meaning, then Next (marks it done for today). Progress is kept
// by the parent through `done` / `onDone`, so leaving and coming back resumes.
// With `onGrade` (Mastered review) the card ends with Forgot / Knew it instead of Next.
export default function Walk({
  title, words, done, onDone, randomOrder = false, onGrade,
  stages, onStageChange, onBack, finishedTitle, finishedText,
}) {
  // Fixed when the walk opens; only the Shuffle button changes it.
  const [order, setOrder] = useState(() => {
    const left = words.filter(w => !done.has(w.lower));
    return randomOrder ? shuffle(left) : left;
  });
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = order[index];
  const doneCount = words.filter(w => done.has(w.lower)).length;
  const stage = current ? stageOf(stages, current) : 'new';
  // A review word moved out of Mastered during the walk can only be skipped.
  const grading = onGrade && stage === 'mastered';

  // Mixes up the cards not yet done (including the current one).
  const reshuffle = () => {
    setOrder(o => [...o.slice(0, index), ...shuffle(o.slice(index))]);
    setRevealed(false);
  };

  const advance = () => {
    setIndex(i => i + 1);
    setRevealed(false);
  };
  const next = () => {
    if (!current) return;
    if (!onGrade) onDone(current);
    advance();
  };
  const grade = remembered => {
    if (!current || !grading) return;
    onGrade(current, remembered);
    advance();
  };

  // Space = show meaning, Enter = next / knew it, F = forgot, P = pronounce, 1–5 = stage.
  useEffect(() => {
    const onKey = e => {
      if (!current || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (e.key === ' ' && !revealed) {
        e.preventDefault();
        setRevealed(true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        grading ? grade(true) : next();
      } else if (key === 'f' && grading) {
        grade(false);
      } else if (key === 'p') {
        speak(current.word);
      } else if (STAGE_IDS[Number(key) - 1]) {
        onStageChange(current, STAGE_IDS[Number(key) - 1]);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (!current) {
    return (
      <section className="card center">
        <h2>{finishedTitle}</h2>
        <p className="muted">{finishedText}</p>
        <div className="row">
          <button className="primary" autoFocus onClick={onBack}>Back to today</button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="progress-row">
        <span>{title}</span>
        <span className="muted">{doneCount} / {words.length} done</span>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${(doneCount / Math.max(1, words.length)) * 100}%` }} />
      </div>

      <div className="card">
        <div className="muted small">Do you remember this word?</div>
        <div className="prompt word-title">{current.word} <SpeakButton text={current.word} /></div>

        {revealed ? (
          <div className="walk-back">
            <WordDetails word={current} showTitle={false} />
          </div>
        ) : (
          <button className="ghost wide" onClick={() => setRevealed(true)}>
            Show meaning <kbd>Space</kbd>
          </button>
        )}

        <div className="walk-stage">
          <span className="muted small-text">Stage:</span>
          <StagePicker stage={stage} onChange={s => onStageChange(current, s)} showKeys />
        </div>

        <div className="walk-actions">
          {grading ? (
            <>
              <button className="ghost danger" onClick={() => grade(false)}>Forgot <kbd>F</kbd></button>
              <button className="primary" autoFocus onClick={() => grade(true)}>Knew it <kbd>↵</kbd></button>
            </>
          ) : (
            <button className="primary" autoFocus onClick={next}>Next <kbd>↵</kbd></button>
          )}
        </div>
      </div>

      <div className="quiz-actions">
        <button className="ghost" onClick={onBack}>← Today (progress is saved)</button>
        {order.length - index > 1 && (
          <button className="ghost" onClick={reshuffle} title="Shuffle the remaining words">🔀 Shuffle</button>
        )}
      </div>
    </section>
  );
}
