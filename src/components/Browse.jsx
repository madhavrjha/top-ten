import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import WordDetails from './WordDetails.jsx';
import SetPicker from './SetPicker.jsx';
import LevelFilter from './LevelFilter.jsx';
import LevelPicker from './LevelPicker.jsx';
import { matchesFilter } from '../levels.js';

// Rows are rendered in pages as you scroll, so long lists stay fast.
const PAGE = 60;

export default function Browse({ sets, initialSetId, initialFilter, levels, onSetLevel, onBack }) {
  const [query, setQuery] = useState('');
  const [setId, setSetId] = useState(initialSetId);
  const [filter, setFilter] = useState(initialFilter);
  const [open, setOpen] = useState(() => new Set());
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef(null);

  // Typing stays responsive; filtering runs on the deferred value.
  const deferredQuery = useDeferredValue(query);
  const words = (sets.find(x => x.id === setId) || sets[0]).words;

  // Search by word only, so meanings stay hidden until expanded.
  const list = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return words.filter(w => (!q || w.lower.includes(q)) && matchesFilter(levels[w.lower], filter));
  }, [words, deferredQuery, levels, filter]);

  // Back to the first page when the set, filter or search changes
  // (but not when a word's level is marked, so the list doesn't jump).
  useEffect(() => setLimit(PAGE), [words, deferredQuery, filter]);

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

  const groups = useMemo(() => {
    const g = [];
    for (const w of list.slice(0, limit)) {
      const letter = w.word[0].toUpperCase();
      if (!g.length || g[g.length - 1].letter !== letter) g.push({ letter, words: [] });
      g[g.length - 1].words.push(w);
    }
    return g;
  }, [list, limit]);

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
        <SetPicker sets={sets} value={setId} onChange={setSetId} />
      </div>
      <div className="browse-sets">
        <LevelFilter words={words} levels={levels} value={filter} onChange={setFilter} />
      </div>

      {list.length === 0 && <p className="muted center">No matching words.</p>}
      {list.length > 0 && (
        <p className="muted small-text">{list.length} word{list.length === 1 ? '' : 's'}</p>
      )}

      {groups.map(g => (
        <div key={g.letter} className="letter-group">
          <h2 className="letter">{g.letter}</h2>
          <div className="word-list">
            {g.words.map(w => (
              <WordRow
                key={w.word}
                word={w}
                level={levels[w.lower] || null}
                isOpen={open.has(w.word)}
                onToggle={toggle}
                onSetLevel={onSetLevel}
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
const WordRow = memo(function WordRow({ word, level, isOpen, onToggle, onSetLevel }) {
  return (
    <div className={`word-row ${isOpen ? 'open' : ''}`}>
      <button className="word-toggle" onClick={() => onToggle(word.word)} aria-expanded={isOpen}>
        <span className="word-name">
          {level && <span className={`dot ${level}`} title={level} />}
          {word.word}
        </span>
        <svg className="chevron" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div className="word-body">
          <WordDetails word={word} showTitle={false} />
          <LevelPicker level={level} onChange={lvl => onSetLevel(word, lvl)} />
        </div>
      )}
    </div>
  );
});
