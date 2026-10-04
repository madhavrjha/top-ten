import { useEffect, useRef, useState } from 'react';
import { newSession, nextQuestion, answer, checkSpelling } from '../session.js';
import { LEVELS } from '../levels.js';
import WordDetails from './WordDetails.jsx';
import LevelPicker from './LevelPicker.jsx';
import SpeakButton from './SpeakButton.jsx';
import { speak } from '../speech.js';

export default function Quiz({ level, setWords, setLabel, words, levels, onSetLevel, onQuit }) {
  const [s, setS] = useState(() => newSession(setWords, words, level));
  const nextRef = useRef(null);

  const pickMeaning = option => {
    if (s.phase !== 'question') return;
    setS(answer(s, option.word === s.current.word, { picked: option.word }));
  };

  const submitSpelling = typed => {
    if (s.phase !== 'question') return;
    const verdict = checkSpelling(typed, s);
    setS(answer(s, verdict !== 'wrong', { typed, form: verdict === 'form' }));
  };

  const next = () => setS(nextQuestion);

  // Keyboard: 1–4 picks an option (Level 1), Enter goes to the next word,
  // E / M / H marks the answered word Easy / Medium / Hard.
  useEffect(() => {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const mark = LEVELS.find(l => l.key === e.key.toLowerCase());
      if (s.phase === 'answered' && e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (e.key.toLowerCase() === 'p' && (s.phase === 'answered' || level === 1)) {
        // P pronounces the word — in Level 2 only after answering, so it isn't a giveaway.
        speak(s.current.word);
      } else if (s.phase === 'answered' && mark) {
        const cur = levels[s.current.lower] || null;
        onSetLevel(s.current, cur === mark.id ? null : mark.id);
      } else if (s.phase === 'question' && level === 1 && /^[1-9]$/.test(e.key)) {
        const opt = s.options[Number(e.key) - 1];
        if (opt) pickMeaning(opt);
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
          You cleared all {s.total} word{s.total === 1 ? '' : 's'} in {setLabel} at Level {level}.
        </p>
        <div className="row">
          <button className="ghost" onClick={onQuit}>Home</button>
          <button className="primary" autoFocus onClick={() => setS(newSession(setWords, words, level))}>
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
        <span>Level {level} · {setLabel}</span>
        <span className="muted">{s.cleared} / {s.total} cleared</span>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${(s.cleared / s.total) * 100}%` }} />
      </div>

      <div className="card">
        {level === 1 ? (
          <MeaningQuestion s={s} onPick={pickMeaning} />
        ) : (
          <SpellQuestion key={s.qid} word={s.current} answered={answered} onSubmit={submitSpelling} />
        )}

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
            <LevelPicker
              level={levels[s.current.lower] || null}
              onChange={lvl => onSetLevel(s.current, lvl)}
              showKeys
            />
          </div>
        )}
      </div>

      <div className="quiz-actions">
        <button className="ghost" onClick={onQuit}>Quit</button>
        {answered && <button ref={nextRef} className="primary" onClick={next}>Next ↵</button>}
      </div>
    </section>
  );
}

function MeaningQuestion({ s, onPick }) {
  const answered = s.phase === 'answered';
  return (
    <>
      <div className="muted small">What does this word mean?</div>
      <div className="prompt word-title">{s.current.word} <SpeakButton text={s.current.word} /></div>
      <div className="options">
        {s.options.map((o, i) => {
          let cls = '';
          if (answered && o.word === s.current.word) cls = 'correct';
          else if (answered && o.word === s.result.picked) cls = 'wrong';
          return (
            <button key={o.word} type="button" className={cls} disabled={answered} onClick={() => onPick(o)}>
              {i + 1}. {o.meaning}
            </button>
          );
        })}
      </div>
    </>
  );
}

function SpellQuestion({ word, answered, onSubmit }) {
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(() => new Set());
  const inputRef = useRef(null);

  // Blanks are shown from the start. "Show hint" reveals the next letter from the
  // left, or click any blank to reveal that letter. Once only one letter is left
  // hidden, the memory trick (word masked) is shown as the final hint.
  const chars = [...word.word];
  const isLetter = ch => ch !== ' ' && ch !== '-';
  const hidden = chars.map((ch, i) => i).filter(i => isLetter(chars[i]) && !revealed.has(i));
  const maxed = hidden.length <= 1;
  const maskedTrick = word.trick.replace(new RegExp(escapeRegExp(word.word), 'gi'), '____');

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
      <div className="muted small">Type the word that means…</div>
      <div className="prompt meaning">{word.meaning}</div>
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
      <div className="hint-row">
        <button type="button" className="ghost" disabled={answered || maxed}
          onClick={() => reveal(hidden[0])}>
          {revealed.size ? 'Next letter' : 'Show hint'}
        </button>
        {maxed && word.trick && !answered && <div className="hint">💡 {maskedTrick}</div>}
      </div>
    </>
  );
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
