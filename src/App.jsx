import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORDS } from './words.js';
import { clearSavedData } from './utils.js';
import { STAGES, loadStages, saveStages, setStage, gradeReview, undoReviews, isDue, reviewedToday, dueLabel } from './stages.js';
import { loadSpell } from './spellProgress.js';
import { loadDaily, saveDaily, setLetter, letterDoneSet, markLetterDone, noteReview, clearToday } from './daily.js';
import { useRoute, navigate, href } from './router.js';
import Home from './components/Home.jsx';
import Quiz, { MODES } from './components/Quiz.jsx';
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
  // Routes: #/  #/browse/<set>  #/spell/<set>  #/pick/<set>  #/today/letter  #/today/review
  const path = useRoute();
  const [, page = '', param = ''] = path.split('/');
  const [setId, setSetId] = useState(() => load(SET_KEY, 'all'));
  const [stages, setStages] = useState(loadStages);
  const [dataVersion, setDataVersion] = useState(0); // bumps after clearing saved data
  const goHome = () => navigate('/');

  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Ref mirrors the latest map so the stable callbacks below never use a stale copy.
  const stagesRef = useRef(stages);
  stagesRef.current = stages;

  const updateStages = useCallback(fn => {
    const next = fn(stagesRef.current);
    stagesRef.current = next;
    setStages(next);
    if (!saveStages(next)) setToast("Couldn't save — this browser is blocking storage (private mode?).");
  }, []);
  const changeStage = useCallback((word, stage) => updateStages(m => setStage(m, word, stage)), [updateStages]);

  // Today's tasks (letter of the day + Mastered review).
  const letterWords = useMemo(() => {
    const byLetter = {};
    WORDS.forEach(w => (byLetter[w.word[0].toLowerCase()] ||= []).push(w));
    return byLetter;
  }, []);
  const [daily, setDaily] = useState(() => loadDaily(letterWords));
  const [reviewWalkId, setReviewWalkId] = useState(0); // new id = fresh review walk
  const [shuffleLetter, setShuffleLetter] = useState(() => load(SHUFFLE_KEY, '') === '1');
  const changeShuffle = on => { setShuffleLetter(on); store(SHUFFLE_KEY, on ? '1' : ''); };
  const updateDaily = fn => setDaily(prev => {
    const next = fn(prev);
    if (next !== prev) saveDaily(next);
    return next;
  });

  const grade = (word, remembered) => {
    const before = stagesRef.current[word.lower]; // read now; the updater below runs later
    updateDaily(d => noteReview(d, word, before));
    updateStages(m => gradeReview(m, word, remembered));
  };

  // Resets only today: letter-of-the-day progress and today's Mastered reviews.
  // Stages, spelling progress and everything else stay.
  const clearProgress = () => {
    if (!window.confirm("Clear today's progress? Today's letter progress and Mastered reviews are reset. Word stages and everything else stay.")) return;
    updateStages(m => undoReviews(m, daily.reviewed));
    updateDaily(clearToday);
    setToast("Today's progress cleared.");
  };

  const clearData = () => {
    if (!window.confirm('Clear all saved data in this browser? Every word goes back to New, and your progress, voice and set choices are reset.')) return;
    if (!clearSavedData()) {
      setToast("Couldn't clear saved data in this browser.");
      return;
    }
    setStages({});
    setSetId('all');
    setDaily(loadDaily(letterWords));
    setShuffleLetter(false);
    setDataVersion(v => v + 1);
    setToast('Saved data cleared.');
  };

  // "All", one set per stage, then one set per starting letter.
  const letterSets = useMemo(() => Object.keys(letterWords).sort()
    .map(l => ({ id: l, label: `Letter ${l.toUpperCase()}`, words: letterWords[l] })), [letterWords]);
  const sets = useMemo(() => [
    { id: 'all', label: 'All words', words: WORDS },
    ...STAGES.map(st => ({
      id: st.id,
      label: st.label,
      words: WORDS.filter(w => (stages[w.lower]?.stage || 'new') === st.id),
    })),
    ...letterSets,
  ], [letterSets, stages]);
  const practiceSet = sets.find(x => x.id === setId) || sets[0];
  // The set named in the URL for #/browse/<set> and #/spell/<set>.
  const routeSet = sets.find(x => x.id === param) || null;

  const changeSet = id => { setSetId(id); store(SET_KEY, id); };

  // Which screen the URL points to; anything unknown goes back to Home.
  const screen =
    page === '' ? 'home'
    : page === 'browse' && routeSet ? 'browse'
    : page === 'spell' && routeSet ? 'spell'
    : page === 'pick' && routeSet ? 'pick'
    : page === 'today' && param === 'letter' ? 'today-letter'
    : page === 'today' && param === 'review' ? 'today-review'
    : null;

  useEffect(() => {
    if (!screen) navigate('/', { replace: true });
  }, [screen]);

  // Opening a set from its URL also makes it the selected set on Home.
  useEffect(() => {
    if (['browse', 'spell', 'pick'].includes(screen) && routeSet.id !== setId) changeSet(routeSet.id);
  }, [screen, routeSet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.scrollTo(0, 0);
    const titles = {
      browse: `Browse · ${routeSet?.label}`,
      spell: `Spell · ${routeSet?.label}`,
      pick: `Pick the meaning · ${routeSet?.label}`,
      'today-letter': 'Letter of the day',
      'today-review': 'Mastered review',
    };
    document.title = titles[screen] ? `${titles[screen]} — Vocab Trainer` : 'Vocab Trainer';
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mastered review: words due today plus the ones already reviewed today.
  const masteredWords = sets.find(x => x.id === 'mastered').words;
  const reviewWords = masteredWords.filter(w => isDue(stages[w.lower]) || reviewedToday(stages[w.lower]));
  const reviewDoneSet = new Set(reviewWords.filter(w => reviewedToday(stages[w.lower])).map(w => w.lower));
  const nextDueEntry = masteredWords.map(w => stages[w.lower]).filter(e => !isDue(e))
    .sort((a, b) => a.due.localeCompare(b.due))[0];

  // Saved quiz progress for the chosen set (re-read whenever Home shows).
  const quizSaved = useMemo(() => {
    if (screen !== 'home') return {};
    const get = mode => {
      const saved = loadSpell(MODES[mode].progressKey(practiceSet.id));
      return saved && saved.remaining?.length ? saved : null;
    };
    return { spell: get('spell'), pick: get('pick') };
  }, [screen, practiceSet.id, dataVersion]);
  const todayLetterWords = letterWords[daily.letter] || [];
  const todayLetterDone = letterDoneSet(daily);

  return (
    <main className="app">
      <header className="top">
        <h1><a href={href('/')}>Vocab Trainer</a></h1>
        <span className="muted">{WORDS.length} words</span>
      </header>

      {screen === 'home' && (
        <Home
          sets={sets}
          setId={practiceSet.id}
          onSetChange={changeSet}
          practiceSet={practiceSet}
          quizSaved={quizSaved}
          onPick={id => navigate(`/${id}/${practiceSet.id}`)}
          today={{
            letters: Object.keys(letterWords).sort(),
            letter: daily.letter,
            letterWords: todayLetterWords,
            letterDone: todayLetterWords.filter(w => todayLetterDone.has(w.lower)).length,
            onLetterChange: l => updateDaily(d => setLetter(d, l)),
            onStartLetter: () => navigate('/today/letter'),
            shuffleLetter,
            onShuffleChange: changeShuffle,
            masteredCount: masteredWords.length,
            reviewDue: reviewWords.length - reviewDoneSet.size,
            reviewDone: reviewDoneSet.size,
            nextDue: nextDueEntry ? dueLabel(nextDueEntry).replace('review ', '') : '',
            onStartReview: () => { setReviewWalkId(i => i + 1); navigate('/today/review'); },
            hasProgress: todayLetterDone.size > 0 || reviewDoneSet.size > 0,
            onClear: clearProgress,
          }}
          onClearToday={clearProgress}
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
          stages={stages}
          onStageChange={changeStage}
          onBack={goHome}
          finishedTitle={`Letter ${daily.letter.toUpperCase()} done! 🎉`}
          finishedText={`You went through all ${todayLetterWords.length} words.`}
        />
      )}
      {screen === 'today-review' && (
        <Walk
          key={`review-${reviewWalkId}`}
          title="✅ Mastered review"
          words={reviewWords}
          done={reviewDoneSet}
          randomOrder
          onGrade={grade}
          stages={stages}
          onStageChange={changeStage}
          onBack={goHome}
          finishedTitle="Review done! 🎉"
          finishedText="Every Mastered word due today is reviewed. The ones you knew come back later than last time."
        />
      )}
      {screen === 'browse' && (
        <Browse
          sets={sets}
          setId={routeSet.id}
          onSetChange={id => navigate(`/browse/${id}`, { replace: true })}
          stages={stages}
          onStageChange={changeStage}
          onBack={goHome}
        />
      )}
      {(screen === 'spell' || screen === 'pick') && (
        <Quiz
          key={`${screen}-${routeSet.id}`}
          mode={screen}
          setId={routeSet.id}
          setWords={routeSet.words}
          setLabel={routeSet.label}
          words={WORDS}
          stages={stages}
          onStageChange={changeStage}
          onQuit={goHome}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
