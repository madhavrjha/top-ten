import { useEffect, useRef, useState } from 'react';
import { newSession, nextQuestion, answer, checkSpelling, serializeSession, resumeSession } from '../session.js';
import { loadSpell, saveSpell, clearSpell } from '../spellProgress.js';
import WordDetails from './WordDetails.jsx';
import StagePicker from './StagePicker.jsx';
import SpeakButton from './SpeakButton.jsx';
import { STAGE_IDS, stageOf } from '../stages.js';
import { speak } from '../speech.js';

export const MODES = {
  spell: { title: 'Spell the word', progressKey: id => id },
  pick: { title: 'Pick the meaning', progressKey: id => `pick:${id}` },
};

// Two quiz modes over a set: 'spell' (see the meaning, type the word) and
// 'pick' (see the word, choose its meaning from 4). Progress is saved after
// every answer and resumed next time this set is opened in the same mode.
export default function Quiz({ mode = 'spell', setId, setWords, setLabel, words, stages, onStageChange, onQuit }) {
  const progressKey = MODES[mode].progressKey(setId);
  const [s, setS] = useState(() =>
    resumeSession(loadSpell(progressKey), setWords, words, mode) || newSession(setWords, words, mode));
  const nextRef = useRef(null);

  useEffect(() => {
    if (s.phase === 'done') clearSpell(progressKey);
    else saveSpell(progressKey, serializeSession(s));
  }, [s, progressKey]);

  const startOver = () => {
    if (!window.confirm(`Start ${setLabel} over? Your progress in this set will be reset.`)) return;
    setS(newSession(setWords, words, mode));
  };

  const submitSpelling = typed => {
    if (s.phase !== 'question') return;
    const verdict = checkSpelling(typed, s);
    setS(answer(s, verdict !== 'wrong', { typed, form: verdict === 'form' }));
  };

  const pickMeaning = option => {
    if (s.phase !== 'question') return;
    setS(answer(s, option.key === s.current.key, { picked: option.word }));
  };

  const next = () => setS(nextQuestion);

  // Keyboard: 1–4 picks an option (Pick the meaning). After answering:
  // Enter = next word, P = pronounce, 1–5 = stage.
  useEffect(() => {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (s.phase === 'question' && mode === 'pick') {
        const opt = s.options[Number(e.key) - 1];
        if (opt) pickMeaning(opt);
        else if (key === 'p') speak(s.current.word);
        return;
      }
      if (s.phase !== 'answered') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (key === 'p') {
        speak(s.current.word);
      } else if (STAGE_IDS[Number(key) - 1]) {
        onStageChange(s.current, STAGE_IDS[Number(key) - 1]);
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
          <button className="primary" autoFocus onClick={() => setS(newSession(setWords, words, mode))}>
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
        <span>{MODES[mode].title} · {setLabel}</span>
        <span className="muted">{s.cleared} / {s.total} cleared</span>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${(s.cleared / s.total) * 100}%` }} />
      </div>

      <div className="card">
        {mode === 'pick' ? (
          <MeaningQuestion s={s} onPick={pickMeaning} />
        ) : (
          <SpellQuestion
            key={s.qid}
            label="Type the word that means…"
            prompt={<div className="prompt meaning">{s.current.meaning}</div>}
            answerText={s.current.word}
            hint={s.current.trick && `💡 ${maskWord(s.current.trick, s.current.word)}`}
            answered={answered}
            onSubmit={submitSpelling}
          />
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
            <div className="walk-stage">
              <span className="muted small-text">Stage:</span>
              <StagePicker stage={stageOf(stages, s.current)} onChange={st => onStageChange(s.current, st)} showKeys />
            </div>
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

function MeaningQuestion({ s, onPick }) {
  const answered = s.phase === 'answered';
  return (
    <>
      <div className="muted small">What does this word mean?</div>
      <div className="prompt word-title">{s.current.word} <SpeakButton text={s.current.word} /></div>
      <div className="options">
        {s.options.map((o, i) => {
          let cls = '';
          if (answered && o.key === s.current.key) cls = 'correct';
          else if (answered && o.word === s.result.picked) cls = 'wrong';
          return (
            <button key={o.word} type="button" className={cls} disabled={answered} onClick={() => onPick(o)}>
              <kbd>{i + 1}</kbd> {o.meaning}
            </button>
          );
        })}
      </div>
    </>
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
