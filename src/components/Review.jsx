import { useEffect, useState } from 'react';
import {
  RATINGS, loadState, saveState, planToday, rate, nextStep, intervalDays, describeDays, stats,
} from '../review.js';
import { shuffle } from '../utils.js';
import { speak } from '../speech.js';
import WordDetails from './WordDetails.jsx';
import SpeakButton from './SpeakButton.jsx';
import LevelPicker from './LevelPicker.jsx';

// Forgotten cards come back this many cards later in the same session.
const RETRY_GAP = 3;

export default function Review({ words, levels, onSetLevel, onQuit }) {
  const [session, setSession] = useState(() => {
    const state = loadState();
    const { due, fresh } = planToday(words, state, levels);
    return {
      state,
      queue: [...shuffle(due), ...fresh],
      total: due.length + fresh.length,
      done: 0,
      lapsed: new Set(), // forgotten earlier in this session
      flipped: false,
      saveFailed: false,
    };
  });

  const current = session.queue[0];
  const card = current && session.state.cards[current.lower];
  const lapsedNow = current ? session.lapsed.has(current.lower) : false;
  const mark = current ? levels[current.lower] || null : null;

  const flip = () => setSession(s => ({ ...s, flipped: true }));

  const answer = rating => {
    if (!current || !session.flipped) return;
    const state = rate(session.state, current, rating, { lapsedNow, mark });
    const saved = saveState(state);
    let queue = session.queue.slice(1);
    const lapsed = new Set(session.lapsed);
    if (rating === 'forgot') {
      lapsed.add(current.lower);
      const pos = Math.min(queue.length, RETRY_GAP);
      queue = [...queue.slice(0, pos), current, ...queue.slice(pos)];
    }
    setSession(s => ({
      ...s,
      state,
      queue,
      lapsed,
      done: s.done + (rating === 'forgot' ? 0 : 1),
      flipped: false,
      saveFailed: s.saveFailed || !saved,
    }));
  };

  // Keyboard: Space/Enter shows the answer, 1/2/3 rates, P pronounces.
  useEffect(() => {
    const onKey = e => {
      if (!current || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!session.flipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        flip();
      } else if (session.flipped && RATINGS.some(r => r.key === e.key)) {
        answer(RATINGS.find(r => r.key === e.key).id);
      } else if (e.key.toLowerCase() === 'p') {
        speak(current.word);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (!current) {
    const st = stats(words, session.state);
    return (
      <section className="card center">
        <h2>{session.total ? 'Daily review done! 🎉' : 'Nothing to review today 🎉'}</h2>
        <p className="muted">
          {session.total > 0 && <>You reviewed {session.total} word{session.total === 1 ? '' : 's'}. </>}
          {st.dueTomorrow > 0
            ? `${st.dueTomorrow} word${st.dueTomorrow === 1 ? '' : 's'} due tomorrow.`
            : 'Come back tomorrow for more.'}
        </p>
        <p className="muted small-text">Learned {st.learned} of {st.total} words so far.</p>
        {session.saveFailed && <p className="bad-text">Progress couldn't be saved in this browser (private mode?).</p>}
        <div className="row">
          <button className="primary" autoFocus onClick={onQuit}>Home</button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="progress-row">
        <span>Daily review</span>
        <span className="muted">{session.done} / {session.total} done</span>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${(session.done / session.total) * 100}%` }} />
      </div>

      <div className="card flashcard">
        <div className="muted small">
          {!card ? 'New word' : lapsedNow ? 'Try again' : 'Review'}
        </div>
        <div className="prompt word-title">{current.word} <SpeakButton text={current.word} /></div>

        {!session.flipped ? (
          <>
            <p className="muted">Do you remember what it means?</p>
            <button className="primary wide" autoFocus onClick={flip}>Show answer <kbd>Space</kbd></button>
          </>
        ) : (
          <>
            <div className="flash-back">
              <WordDetails word={current} showTitle={false} />
              <LevelPicker level={mark} onChange={lvl => onSetLevel(current, lvl)} />
            </div>
            <p className="muted small-text">How well did you remember it?</p>
            <div className="rating-row">
              {RATINGS.map(r => {
                const days = intervalDays(nextStep(card, r.id, { lapsedNow }), mark);
                return (
                  <button key={r.id} className={`rating-btn ${r.id}`} onClick={() => answer(r.id)}>
                    <strong>{r.label}</strong>
                    <span className="when">{r.id === 'forgot' ? 'again soon' : describeDays(days)}</span>
                    <kbd>{r.key}</kbd>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="quiz-actions">
        <button className="ghost" onClick={onQuit}>Quit</button>
        {session.saveFailed && <span className="bad-text small-text">Progress isn't being saved in this browser.</span>}
      </div>
    </section>
  );
}
