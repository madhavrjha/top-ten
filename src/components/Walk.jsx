import { useEffect, useState } from 'react';
import { shuffle } from '../utils.js';
import { speak } from '../speech.js';
import WordDetails from './WordDetails.jsx';
import SpeakButton from './SpeakButton.jsx';
import RepeatButton from './RepeatButton.jsx';

// Goes through words one card at a time: see the word, try to recall it,
// reveal the meaning, then Next (marks it done for today). Progress is kept
// by the parent through `done` / `onDone`, so leaving and coming back resumes.
export default function Walk({
  title, words, done, onDone, randomOrder = false,
  repeat, onToggleRepeat, onBack, finishedTitle, finishedText, onContinue, continueLabel,
}) {
  // Fixed when the walk opens, so the order doesn't change mid-way.
  const [order] = useState(() => {
    const left = words.filter(w => !done.has(w.lower));
    return randomOrder ? shuffle(left) : left;
  });
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = order[index];
  const doneCount = words.filter(w => done.has(w.lower)).length;

  const next = () => {
    if (!current) return;
    onDone(current);
    setIndex(i => i + 1);
    setRevealed(false);
  };

  // Space = show meaning, Enter = next, P = pronounce, R = toggle repeat.
  useEffect(() => {
    const onKey = e => {
      if (!current || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (e.key === ' ' && !revealed) {
        e.preventDefault();
        setRevealed(true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (key === 'p') {
        speak(current.word);
      } else if (key === 'r') {
        onToggleRepeat(current);
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
          <button className={onContinue ? 'ghost' : 'primary'} autoFocus={!onContinue} onClick={onBack}>Back to today</button>
          {onContinue && <button className="primary" autoFocus onClick={onContinue}>{continueLabel}</button>}
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

        <div className="walk-actions">
          <RepeatButton
            active={!!repeat[current.lower]}
            since={repeat[current.lower]}
            onToggle={() => onToggleRepeat(current)}
            showKey
          />
          <button className="primary" autoFocus onClick={next}>Next <kbd>↵</kbd></button>
        </div>
      </div>

      <div className="quiz-actions">
        <button className="ghost" onClick={onBack}>← Today (progress is saved)</button>
      </div>
    </section>
  );
}
