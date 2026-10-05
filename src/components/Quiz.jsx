import { useEffect, useRef, useState } from 'react';
import { newSession, nextQuestion, answer, checkSpelling, serializeSession, resumeSession } from '../session.js';
import { loadSpell, saveSpell, clearSpell } from '../spellProgress.js';
import WordDetails from './WordDetails.jsx';
import RepeatButton from './RepeatButton.jsx';
import { speak } from '../speech.js';

// Spell the word: see the meaning, type the word. Progress is saved after
// every answer and resumed next time this set is opened.
export default function Quiz({ setId, setWords, setLabel, words, repeat, onToggleRepeat, onQuit }) {
  const [s, setS] = useState(() =>
    resumeSession(loadSpell(setId), setWords, words) || newSession(setWords, words));
  const nextRef = useRef(null);

  useEffect(() => {
    if (s.phase === 'done') clearSpell(setId);
    else saveSpell(setId, serializeSession(s));
  }, [s, setId]);

  const startOver = () => {
    if (!window.confirm(`Start ${setLabel} over? Your progress in this set will be reset.`)) return;
    setS(newSession(setWords, words));
  };

  const submitSpelling = typed => {
    if (s.phase !== 'question') return;
    const verdict = checkSpelling(typed, s);
    setS(answer(s, verdict !== 'wrong', { typed, form: verdict === 'form' }));
  };

  const next = () => setS(nextQuestion);

  // Keyboard (after answering): Enter = next word, P = pronounce, R = toggle repeat.
  useEffect(() => {
    const onKey = e => {
      if (s.phase !== 'answered' || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (key === 'p') {
        speak(s.current.word);
      } else if (key === 'r') {
        onToggleRepeat(s.current);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (s.phase === 'answered') nextRef.current?.focus();
  }, [s.phase]);

  if (s.phase === 'done') {
    return (
      <section className="card center">
        <h2>Set cleared! 🎉</h2>
        <p className="muted">
          You cleared all {s.total} word{s.total === 1 ? '' : 's'} in {setLabel}.
        </p>
        <div className="row">
          <button className="ghost" onClick={onQuit}>Home</button>
          <button className="primary" autoFocus onClick={() => setS(newSession(setWords, words))}>
            Practice again
          </button>
        </div>
      </section>
    );
  }

  const answered = s.phase === 'answered';

  return (
    <section>
      <div className="progress-row">
        <span>Spell the word · {setLabel}</span>
        <span className="muted">{s.cleared} / {s.total} cleared</span>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${(s.cleared / s.total) * 100}%` }} />
      </div>

      <div className="card">
        <SpellQuestion
          key={s.qid}
          label="Type the word that means…"
          prompt={<div className="prompt meaning">{s.current.meaning}</div>}
          answerText={s.current.word}
          hint={s.current.trick && `💡 ${maskWord(s.current.trick, s.current.word)}`}
          answered={answered}
          onSubmit={submitSpelling}
        />

        {answered && (
          <div className={`feedback ${s.result.form ? 'close' : s.result.correct ? 'good' : 'bad'}`}>
            <div className="verdict">
              {s.result.form
                ? 'Almost! Right word, different form.'
                : s.result.correct ? 'Correct!' : 'Not quite — this one will come back.'}
            </div>
            {s.result.form && (
              <p>You typed <strong>{s.result.typed}</strong> — the exact word is <strong>{s.current.word}</strong>.</p>
            )}
            {!s.result.correct && s.result.typed && (
              <p>You typed <strong>{s.result.typed}</strong></p>
            )}
            <WordDetails word={s.current} />
            <RepeatButton
              active={!!repeat[s.current.lower]}
              since={repeat[s.current.lower]}
              onToggle={() => onToggleRepeat(s.current)}
              showKey
            />
          </div>
        )}
      </div>

      <div className="quiz-actions">
        <span className="row-left">
          <button className="ghost" onClick={onQuit}>← Home (progress is saved)</button>
          {s.cleared > 0 && <button className="link-btn" onClick={startOver}>Start over</button>}
        </span>
        {answered && <button ref={nextRef} className="primary" onClick={next}>Next ↵</button>}
      </div>
    </section>
  );
}

function SpellQuestion({ label, prompt, answerText, hint, answered, onSubmit }) {
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(() => new Set());
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef(null);

  // Two independent hints, used in any order: click a blank to reveal that
  // letter (all but the last one), or "Show hint" for the memory trick.
  const chars = [...answerText];
  const isLetter = ch => ch !== ' ' && ch !== '-';
  const hidden = chars.map((ch, i) => i).filter(i => isLetter(chars[i]) && !revealed.has(i));
  const maxed = hidden.length <= 1;

  const reveal = i => {
    if (answered || maxed || i === undefined) return;
    setRevealed(prev => new Set(prev).add(i));
    inputRef.current?.focus();
  };

  const submit = e => {
    e.preventDefault();
    if (typed.trim()) onSubmit(typed.trim());
  };

  return (
    <>
      <div className="muted small">{label}</div>
      {prompt}
      <form className="spell" onSubmit={submit} autoComplete="off">
        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={e => setTyped(e.target.value)}
          disabled={answered}
          spellCheck={false}
          autoCapitalize="off"
          placeholder="Type the word…"
          autoFocus
        />
        <button type="submit" className="primary" disabled={answered}>Check</button>
      </form>
      <div className="letters" aria-label="Letter hints">
        {chars.map((ch, i) =>
          !isLetter(ch) ? (
            <span key={i} className="gap">{ch === '-' ? '-' : ''}</span>
          ) : revealed.has(i) ? (
            <span key={i} className="tile shown">{ch}</span>
          ) : (
            <button key={i} type="button" className="tile blank" disabled={answered || maxed}
              title="Click to reveal this letter" onClick={() => reveal(i)}>
              &nbsp;
            </button>
          )
        )}
      </div>
      {hint && (
        <div className="hint-row">
          {showHint ? (
            !answered && <div className="hint">{hint}</div>
          ) : (
            <button type="button" className="ghost" disabled={answered}
              onClick={() => { setShowHint(true); inputRef.current?.focus(); }}>
              Show hint
            </button>
          )}
        </div>
      )}
    </>
  );
}

function maskWord(text, word) {
  return text.replace(new RegExp(escapeRegExp(word), 'gi'), '____');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
