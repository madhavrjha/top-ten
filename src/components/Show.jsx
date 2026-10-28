import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { WordRow } from './Browse.jsx';
import { LEVELS, levelOf } from '../shows.js';

const PAGE = 60;

// Words from a show, in the order they come up, with Easy / Medium / Tough tabs
// and the subtitle line under each word.
export default function Show({ show, stages, onStageChange, onBack }) {
  const [level, setLevel] = useState('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set());
  const [limit, setLimit] = useState(PAGE);
  const sentinel = useRef(null);
  const deferredQuery = useDeferredValue(query);

  const counts = useMemo(() => {
    const c = { all: show.items.length };
    for (const x of show.items) c[levelOf(x.word)] = (c[levelOf(x.word)] || 0) + 1;
    return c;
  }, [show]);

  const list = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return show.items.filter(x =>
      (level === 'all' || levelOf(x.word) === level) && (!q || x.word.lower.includes(q)));
  }, [show, level, deferredQuery]);

  useEffect(() => setLimit(PAGE), [level, deferredQuery]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setLimit(l => l + PAGE);
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [list, limit]);

  const toggle = useCallback(word => setOpen(prev => {
    const next = new Set(prev);
    next.has(word) ? next.delete(word) : next.add(word);
    return next;
  }), []);

  const tabs = [{ id: 'all', icon: '', label: 'All' }, ...LEVELS];

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
        />
      </div>
      <h2 className="section-title spaced">{show.icon} {show.title}</h2>
      <p className="muted small-text">Words from the subtitles, in the order they come up. Easy / Medium / Tough = how common the word is.</p>
      <div className="browse-order">
        {tabs.map(t => (
          <button key={t.id} type="button" className={`set-chip ${level === t.id ? 'active' : ''}`}
            aria-pressed={level === t.id} onClick={() => setLevel(t.id)}>
            {t.icon && `${t.icon} `}{t.label} · {counts[t.id] || 0}
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="muted center">No matching words.</p>}

      <div className="word-list letter-group">
        {list.slice(0, limit).map(x => (
          <WordRow
            key={x.word.word}
            word={x.word}
            entry={stages[x.word.lower]}
            isOpen={open.has(x.word.word)}
            onToggle={toggle}
            onStageChange={onStageChange}
            quote={x.line}
          />
        ))}
      </div>

      {limit < list.length && <div ref={sentinel} className="sentinel" aria-hidden="true" />}
    </section>
  );
}
