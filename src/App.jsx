import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORDS } from './words.js';
import { matchesFilter, saveLevel, FILTERS } from './levels.js';
import Home from './components/Home.jsx';
import Quiz from './components/Quiz.jsx';
import Browse from './components/Browse.jsx';

const SET_KEY = 'vocab.practiceSet';
const FILTER_KEY = 'vocab.levelFilter';

function load(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function store(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

export default function App() {
  // screen: 'home' | 'browse' | 1 | 2 (quiz level)
  const [screen, setScreen] = useState('home');
  const [setId, setSetId] = useState(() => load(SET_KEY, 'all'));
  const [filter, setFilter] = useState(() => {
    const f = load(FILTER_KEY, 'any');
    return FILTERS.some(x => x.id === f) ? f : 'any';
  });
  const goHome = () => setScreen('home');

  // Difficulty per word (lowercase word → 'easy' | 'medium' | 'hard').
  const [levels, setLevels] = useState(() =>
    Object.fromEntries(WORDS.filter(w => w.level).map(w => [w.lower, w.level])));
  const levelsRef = useRef(levels);
  levelsRef.current = levels;

  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Update the screen right away, then save to the letter file; undo on failure.
  const setLevel = useCallback((word, level) => {
    const prev = levelsRef.current[word.lower] || null;
    if (prev === level) return;
    const apply = value => setLevels(ls => {
      const next = { ...ls };
      if (value) next[word.lower] = value;
      else delete next[word.lower];
      return next;
    });
    apply(level);
    saveLevel(word.word, level).catch(err => {
      if ((levelsRef.current[word.lower] || null) === level) apply(prev);
      setToast(`Couldn't save "${word.word}": ${err.message}. Is npm run dev running?`);
    });
  }, []);

  // "All" plus one set per starting letter.
  const sets = useMemo(() => {
    const byLetter = {};
    WORDS.forEach(w => (byLetter[w.word[0].toLowerCase()] ||= []).push(w));
    return [
      { id: 'all', label: 'All words', words: WORDS },
      ...Object.keys(byLetter).sort().map(l => ({ id: l, label: `Letter ${l.toUpperCase()}`, words: byLetter[l] })),
    ];
  }, []);
  const letterSet = sets.find(x => x.id === setId) || sets[0];

  // The practice set is the chosen letter narrowed by the difficulty filter.
  const practiceWords = useMemo(
    () => letterSet.words.filter(w => matchesFilter(levels[w.lower], filter)),
    [letterSet, levels, filter]);
  const filterLabel = FILTERS.find(f => f.id === filter).label;
  const practiceLabel = filter === 'any' ? letterSet.label : `${letterSet.label} · ${filterLabel}`;

  const changeSet = id => { setSetId(id); store(SET_KEY, id); };
  const changeFilter = id => { setFilter(id); store(FILTER_KEY, id); };

  return (
    <main className="app">
      <header className="top">
        <h1 onClick={goHome}>Vocab Trainer</h1>
        <span className="muted">{WORDS.length} words</span>
      </header>

      {screen === 'home' && (
        <Home
          sets={sets}
          setId={letterSet.id}
          onSetChange={changeSet}
          letterWords={letterSet.words}
          levels={levels}
          filter={filter}
          onFilterChange={changeFilter}
          practiceCount={practiceWords.length}
          practiceLabel={practiceLabel}
          onPick={setScreen}
          hasWords={WORDS.length > 0}
        />
      )}
      {screen === 'browse' && (
        <Browse
          sets={sets}
          initialSetId={letterSet.id}
          initialFilter={filter}
          levels={levels}
          onSetLevel={setLevel}
          onBack={goHome}
        />
      )}
      {(screen === 1 || screen === 2) && (
        <Quiz
          key={`${screen}-${letterSet.id}-${filter}`}
          level={screen}
          setWords={practiceWords}
          setLabel={practiceLabel}
          words={WORDS}
          levels={levels}
          onSetLevel={setLevel}
          onQuit={goHome}
        />
      )}

      {toast && <div className="toast" role="alert">{toast}</div>}
    </main>
  );
}
