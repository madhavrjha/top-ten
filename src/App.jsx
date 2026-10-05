import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORDS } from './words.js';
import { loadRepeat, saveRepeat, today, clearSavedData } from './repeat.js';
import { loadSpell } from './spellProgress.js';
import { loadDaily, saveDaily, setLetter, letterDoneSet, markLetterDone, markRepeatDone, clearToday, REPEAT_ROUNDS } from './daily.js';
import Home from './components/Home.jsx';
import Quiz from './components/Quiz.jsx';
import Browse from './components/Browse.jsx';
import Walk from './components/Walk.jsx';

const SET_KEY = 'vocab.practiceSet';
const SHUFFLE_KEY = 'vocab.letterShuffle';

function load(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function store(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

export default function App() {
  // screen: 'home' | 'browse' | 'spell' | 'today-letter' | 'today-repeat'
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

  // Today's tasks (letter of the day + repeat rounds), saved per day.
  const letterWords = useMemo(() => {
    const byLetter = {};
    WORDS.forEach(w => (byLetter[w.word[0].toLowerCase()] ||= []).push(w));
    return byLetter;
  }, []);
  const [daily, setDaily] = useState(() => loadDaily(letterWords));
  const [repeatWalkId, setRepeatWalkId] = useState(0); // new id = fresh walk for the next round
  const [shuffleLetter, setShuffleLetter] = useState(() => load(SHUFFLE_KEY, '') === '1');
  const changeShuffle = on => { setShuffleLetter(on); store(SHUFFLE_KEY, on ? '1' : ''); };
  const updateDaily = fn => setDaily(prev => {
    const next = fn(prev);
    if (next !== prev) saveDaily(next);
    return next;
  });

  const clearProgress = () => {
    if (!window.confirm("Clear today's progress? Your repeat list stays.")) return;
    updateDaily(clearToday);
  };

  const clearData = () => {
    if (!window.confirm('Clear all saved data in this browser? This empties your repeat list and resets your voice and set choices.')) return;
    if (!clearSavedData()) {
      setToast("Couldn't clear saved data in this browser.");
      return;
    }
    setRepeat({});
    setSetId('all');
    setDaily(loadDaily(letterWords));
    setShuffleLetter(false);
    setDataVersion(v => v + 1);
    setToast('Saved data cleared.');
  };

  // "All", "Repeat" (your repeat list), then one set per starting letter.
  const letterSets = useMemo(() => Object.keys(letterWords).sort()
    .map(l => ({ id: l, label: `Letter ${l.toUpperCase()}`, words: letterWords[l] })), [letterWords]);
  const sets = useMemo(() => [
    { id: 'all', label: 'All words', words: WORDS },
    { id: 'repeat', label: 'Repeat list', words: WORDS.filter(w => repeat[w.lower]) },
    ...letterSets,
  ], [letterSets, repeat]);
  const practiceSet = sets.find(x => x.id === setId) || sets[0];

  const changeSet = id => { setSetId(id); store(SET_KEY, id); };

  const repeatWords = sets[1].words;

  // Saved Spell progress for the chosen set (re-read whenever Home shows).
  const spellSaved = useMemo(() => {
    if (screen !== 'home') return null;
    const saved = loadSpell(practiceSet.id);
    return saved && saved.remaining?.length ? saved : null;
  }, [screen, practiceSet.id, dataVersion]);
  const todayLetterWords = letterWords[daily.letter] || [];
  const todayLetterDone = letterDoneSet(daily);

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
          spellSaved={spellSaved}
          repeatCount={sets[1].words.length}
          onPick={setScreen}
          today={{
            letters: Object.keys(letterWords).sort(),
            letter: daily.letter,
            letterWords: todayLetterWords,
            letterDone: todayLetterWords.filter(w => todayLetterDone.has(w.lower)).length,
            onLetterChange: l => updateDaily(d => setLetter(d, l)),
            onStartLetter: () => setScreen('today-letter'),
            shuffleLetter,
            onShuffleChange: changeShuffle,
            repeatWords,
            rounds: daily.rounds,
            roundDone: repeatWords.filter(w => daily.roundDone.includes(w.lower)).length,
            onStartRepeat: () => { setRepeatWalkId(i => i + 1); setScreen('today-repeat'); },
            onClear: clearProgress,
          }}
          onClearData={clearData}
          dataVersion={dataVersion}
          hasWords={WORDS.length > 0}
        />
      )}
      {screen === 'today-letter' && (
        <Walk
          key={`letter-${daily.letter}`}
          title={`📖 Letter ${daily.letter.toUpperCase()}`}
          words={todayLetterWords}
          done={todayLetterDone}
          onDone={w => updateDaily(d => markLetterDone(d, w))}
          randomOrder={shuffleLetter}
          repeat={repeat}
          onToggleRepeat={toggleRepeat}
          onBack={goHome}
          finishedTitle={`Letter ${daily.letter.toUpperCase()} done! 🎉`}
          finishedText={`You went through all ${todayLetterWords.length} words. Now do your repeat rounds.`}
        />
      )}
      {screen === 'today-repeat' && (
        <Walk
          key={`repeat-${repeatWalkId}`}
          title={`🔁 Repeat · round ${Math.min(daily.rounds + 1, REPEAT_ROUNDS)} of ${REPEAT_ROUNDS}`}
          words={daily.rounds >= REPEAT_ROUNDS ? [] : repeatWords}
          done={new Set(daily.roundDone)}
          onDone={w => updateDaily(d => markRepeatDone(d, w, repeatWords))}
          randomOrder
          repeat={repeat}
          onToggleRepeat={toggleRepeat}
          onBack={goHome}
          finishedTitle={daily.rounds >= REPEAT_ROUNDS
            ? 'All repeat rounds done today! 🎉'
            : `Round ${daily.rounds} of ${REPEAT_ROUNDS} done!`}
          finishedText={daily.rounds >= REPEAT_ROUNDS
            ? `You went through your repeat list ${REPEAT_ROUNDS} times today.`
            : 'Take a break and come back later, or go again now.'}
          onContinue={daily.rounds < REPEAT_ROUNDS && repeatWords.length > 0 ? () => setRepeatWalkId(i => i + 1) : null}
          continueLabel={`Start round ${daily.rounds + 1}`}
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
          setId={practiceSet.id}
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
