import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORDS } from './words.js';
import { loadRepeat, saveRepeat, today, clearSavedData } from './repeat.js';
import Home from './components/Home.jsx';
import Quiz from './components/Quiz.jsx';
import Browse from './components/Browse.jsx';

const SET_KEY = 'vocab.practiceSet';

function load(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function store(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

export default function App() {
  // screen: 'home' | 'browse' | 'spell'
  const [screen, setScreen] = useState('home');
  const [setId, setSetId] = useState(() => load(SET_KEY, 'all'));
  const [repeat, setRepeat] = useState(loadRepeat);
  const [dataVersion, setDataVersion] = useState(0); // bumps after clearing saved data
  const goHome = () => setScreen('home');

  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Ref mirrors the latest list so the stable callback below never uses a stale copy.
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;

  const toggleRepeat = useCallback(word => {
    const next = { ...repeatRef.current };
    if (next[word.lower]) delete next[word.lower];
    else next[word.lower] = today();
    repeatRef.current = next;
    setRepeat(next);
    if (!saveRepeat(next)) setToast("Couldn't save — this browser is blocking storage (private mode?).");
  }, []);

  const clearData = () => {
    if (!window.confirm('Clear all saved data in this browser? This empties your repeat list and resets your voice and set choices.')) return;
    if (!clearSavedData()) {
      setToast("Couldn't clear saved data in this browser.");
      return;
    }
    setRepeat({});
    setSetId('all');
    setDataVersion(v => v + 1);
    setToast('Saved data cleared.');
  };

  // "All", "Repeat" (your repeat list), then one set per starting letter.
  const letterSets = useMemo(() => {
    const byLetter = {};
    WORDS.forEach(w => (byLetter[w.word[0].toLowerCase()] ||= []).push(w));
    return Object.keys(byLetter).sort()
      .map(l => ({ id: l, label: `Letter ${l.toUpperCase()}`, words: byLetter[l] }));
  }, []);
  const sets = useMemo(() => [
    { id: 'all', label: 'All words', words: WORDS },
    { id: 'repeat', label: 'Repeat list', words: WORDS.filter(w => repeat[w.lower]) },
    ...letterSets,
  ], [letterSets, repeat]);
  const practiceSet = sets.find(x => x.id === setId) || sets[0];

  const changeSet = id => { setSetId(id); store(SET_KEY, id); };

  return (
    <main className="app">
      <header className="top">
        <h1 onClick={goHome}>Vocab Trainer</h1>
        <span className="muted">{WORDS.length} words</span>
      </header>

      {screen === 'home' && (
        <Home
          sets={sets}
          setId={practiceSet.id}
          onSetChange={changeSet}
          practiceSet={practiceSet}
          repeatCount={sets[1].words.length}
          onPick={setScreen}
          onClearData={clearData}
          dataVersion={dataVersion}
          hasWords={WORDS.length > 0}
        />
      )}
      {screen === 'browse' && (
        <Browse
          sets={sets}
          initialSetId={practiceSet.id}
          repeat={repeat}
          onToggleRepeat={toggleRepeat}
          onBack={goHome}
        />
      )}
      {screen === 'spell' && (
        <Quiz
          key={practiceSet.id}
          setWords={practiceSet.words}
          setLabel={practiceSet.label}
          words={WORDS}
          repeat={repeat}
          onToggleRepeat={toggleRepeat}
          onQuit={goHome}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
