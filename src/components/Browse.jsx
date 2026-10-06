import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import WordDetails from './WordDetails.jsx';
import SetPicker from './SetPicker.jsx';
import SpeakButton from './SpeakButton.jsx';
import StagePicker from './StagePicker.jsx';
import RarityBadge from './RarityBadge.jsx';
import { stageInfo, dueLabel } from '../stages.js';
import { shuffle } from '../utils.js';

// Rows are rendered in pages as you scroll, so long lists stay fast.
const PAGE = 60;

export default function Browse({ picker, set, onSetChange, stages, onStageChange, onBack }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set());
  const [limit, setLimit] = useState(PAGE);
  // 'az' (grouped by letter), 'common' (most common first) or 'shuffle'.
  const [order, setOrder] = useState('az');
  // Changing it reshuffles.
  const [shuffleId, setShuffleId] = useState(0);
  const flat = order !== 'az';
  const sentinel = useRef(null);

  // Typing stays responsive; filtering runs on the deferred value.
  const deferredQuery = useDeferredValue(query);
  const setId = set.id;
  const setWords = set.words;
  // A random rank per word, made once per Shuffle click, so changing a stage
  // (which rebuilds the set) doesn't reorder the list.
  const rank = useMemo(
    () => (order === 'shuffle' ? new Map(shuffle(picker.words).map((w, i) => [w.lower, i])) : null),
    [order, shuffleId, picker.words]); // eslint-disable-line react-hooks/exhaustive-deps
  const words = useMemo(() => {
    if (rank) return [...setWords].sort((a, b) => rank.get(a.lower) - rank.get(b.lower));
    if (order === 'common') return [...setWords].sort((a, b) => (b.freq ?? -1) - (a.freq ?? -1));
    return setWords;
  }, [setWords, rank, order]);

  // Search by word only, so meanings stay hidden until expanded.
  const list = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return q ? words.filter(w => w.lower.includes(q)) : words;
  }, [words, deferredQuery]);

  // Back to the first page when the set or search changes.
  useEffect(() => setLimit(PAGE), [setId, order, shuffleId, deferredQuery]);

  const changeOrder = o => {
    if (o === 'shuffle') setShuffleId(n => n + 1);
    setOrder(o);
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

  // A–Z: grouped under letter headings. Common first / shuffled: one flat list.
  const groups = useMemo(() => {
    if (flat) return [{ letter: null, words: list.slice(0, limit) }];
    const g = [];
    for (const w of list.slice(0, limit)) {
      const letter = w.word[0].toUpperCase();
      if (!g.length || g[g.length - 1].letter !== letter) g.push({ letter, words: [] });
      g[g.length - 1].words.push(w);
    }
    return g;
  }, [list, limit, flat]);

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
        <SetPicker {...picker} stage={set.stage} letter={set.letter} rarity={set.rarity} onChange={onSetChange} />
      </div>
      <div className="browse-order">
        <span className="muted small-text">Order:</span>
        <button type="button" className={`set-chip ${order === 'az' ? 'active' : ''}`} aria-pressed={order === 'az'}
          onClick={() => changeOrder('az')}>A–Z</button>
        <button type="button" className={`set-chip ${order === 'common' ? 'active' : ''}`} aria-pressed={order === 'common'}
          onClick={() => changeOrder('common')}>🟢 Common first</button>
        <button type="button" className={`set-chip ${order === 'shuffle' ? 'active' : ''}`} aria-pressed={order === 'shuffle'}
          onClick={() => changeOrder('shuffle')}>🔀 {order === 'shuffle' ? 'Shuffle again' : 'Shuffle'}</button>
      </div>

      {list.length === 0 && (
        <p className="muted center">
          {(set.stage || set.rarity) && !query ? `No ${set.label} words yet.` : 'No matching words.'}
        </p>
      )}
      {list.length > 0 && (
        <p className="muted small-text">{list.length} word{list.length === 1 ? '' : 's'}</p>
      )}

      {groups.map(g => (
        <div key={g.letter ?? 'flat'} className="letter-group">
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
          <RarityBadge word={word} compact />
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
