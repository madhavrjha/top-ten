import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import WordDetails from './WordDetails.jsx';
import SetPicker from './SetPicker.jsx';
import SpeakButton from './SpeakButton.jsx';
import StagePicker from './StagePicker.jsx';
import { stageInfo, dueLabel } from '../stages.js';
import { shuffle } from '../utils.js';

// Rows are rendered in pages as you scroll, so long lists stay fast.
const PAGE = 60;

export default function Browse({ picker, set, onSetChange, stages, onStageChange, onBack }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set());
  const [limit, setLimit] = useState(PAGE);
  // null = A–Z order; a number = shuffled (changing it reshuffles).
  const [shuffleId, setShuffleId] = useState(null);
  const shuffled = shuffleId !== null;
  const sentinel = useRef(null);

  // Typing stays responsive; filtering runs on the deferred value.
  const deferredQuery = useDeferredValue(query);
  const setId = set.id;
  const setWords = set.words;
  // A random rank per word, made once per Shuffle click, so changing a stage
  // (which rebuilds the set) doesn't reorder the list.
  const rank = useMemo(
    () => (shuffleId === null ? null : new Map(shuffle(picker.words).map((w, i) => [w.lower, i]))),
    [shuffleId, picker.words]);
  const words = useMemo(
    () => (rank ? [...setWords].sort((a, b) => rank.get(a.lower) - rank.get(b.lower)) : setWords),
    [setWords, rank]);

  // Search by word only, so meanings stay hidden until expanded.
  const list = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return q ? words.filter(w => w.lower.includes(q)) : words;
  }, [words, deferredQuery]);

  // Back to the first page when the set or search changes.
  useEffect(() => setLimit(PAGE), [setId, shuffleId, deferredQuery]);

  const reshuffle = () => {
    setShuffleId(n => (n ?? 0) + 1);
    window.scrollTo({ top: 0 });
  };

  // Load the next page when the bottom of the list scrolls into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setLimit(l => l + PAGE);
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [list, limit]);

  // A–Z: grouped under letter headings. Shuffled: one flat list.
  const groups = useMemo(() => {
    if (shuffled) return [{ letter: null, words: list.slice(0, limit) }];
    const g = [];
    for (const w of list.slice(0, limit)) {
      const letter = w.word[0].toUpperCase();
      if (!g.length || g[g.length - 1].letter !== letter) g.push({ letter, words: [] });
      g[g.length - 1].words.push(w);
    }
    return g;
  }, [list, limit, shuffled]);

  const toggle = useCallback(word => setOpen(prev => {
    const next = new Set(prev);
    next.has(word) ? next.delete(word) : next.add(word);
    return next;
  }), []);

  return (
    <section>
      <div className="row">
        <button className="ghost" onClick={onBack}>← Back</button>
        <input
          className="search"
          type="search"
          placeholder="Search words…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="browse-sets">
        <SetPicker {...picker} stage={set.stage} letter={set.letter} onChange={onSetChange} />
      </div>
      <div className="browse-order">
        <button type="button" className={shuffled ? 'primary' : 'ghost'} onClick={reshuffle}>
          🔀 {shuffled ? 'Shuffle again' : 'Shuffle'}
        </button>
        {shuffled && (
          <button type="button" className="ghost" onClick={() => setShuffleId(null)}>A–Z order</button>
        )}
      </div>

      {list.length === 0 && (
        <p className="muted center">
          {set.stage && !query ? `No ${set.label} words yet.` : 'No matching words.'}
        </p>
      )}
      {list.length > 0 && (
        <p className="muted small-text">{list.length} word{list.length === 1 ? '' : 's'}</p>
      )}

      {groups.map(g => (
        <div key={g.letter ?? 'shuffled'} className="letter-group">
          {g.letter && <h2 className="letter">{g.letter}</h2>}
          <div className="word-list">
            {g.words.map(w => (
              <WordRow
                key={w.word}
                word={w}
                entry={stages[w.lower]}
                isOpen={open.has(w.word)}
                onToggle={toggle}
                onStageChange={onStageChange}
              />
            ))}
          </div>
        </div>
      ))}

      {limit < list.length && <div ref={sentinel} className="sentinel" aria-hidden="true" />}
    </section>
  );
}

// Memoized so expanding one word doesn't re-render every other row.
const WordRow = memo(function WordRow({ word, entry, isOpen, onToggle, onStageChange }) {
  return (
    <div className={`word-row ${isOpen ? 'open' : ''}`}>
      <div className="word-head">
        <SpeakButton text={word.word} className="row-speak" />
        <button className="word-toggle" onClick={() => onToggle(word.word)} aria-expanded={isOpen}>
          <span className="word-name">{word.word}</span>
          <svg className="chevron" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <StagePicker
          stage={entry?.stage || 'new'}
          title={entry?.stage === 'mastered' ? `Mastered · ${dueLabel(entry)}` : stageInfo(entry?.stage).hint}
          onChange={s => onStageChange(word, s)}
          compact
        />
      </div>
      {isOpen && (
        <div className="word-body">
          <WordDetails word={word} showTitle={false} />
        </div>
      )}
    </div>
  );
});
