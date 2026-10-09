import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORDS } from './words.js';
import { clearSavedData } from './utils.js';
import { buildSet } from './sets.js';
import { loadStages, saveStages, setStage, gradeReview, undoReviews, isDue, reviewedToday, dueLabel } from './stages.js';
import { loadSpell } from './spellProgress.js';
import { loadDaily, saveDaily, noteReview, noteSet, clearToday } from './daily.js';
import { buildStudySets, loadProgress, saveProgress, startSet, finishRound, setStatus, statusOf, isDueSet, isLearningToday, roundsToday } from './studySets.js';
import { useRoute, navigate, href } from './router.js';
import Home from './components/Home.jsx';
import Quiz, { MODES } from './components/Quiz.jsx';
import Browse from './components/Browse.jsx';
import Walk from './components/Walk.jsx';
import SetList from './components/SetList.jsx';
import SetStudy from './components/SetStudy.jsx';

const SET_KEY = 'vocab.practiceSet';

function load(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function store(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

export default function App() {
  // Routes: #/  #/browse/<set>  #/spell/<set>  #/pick/<set>  #/sets  #/set/<number>  #/today/review
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

  // Letters that have words (for the filter panel).
  const letters = useMemo(() => [...new Set(WORDS.map(w => w.word[0].toLowerCase()))].sort(), []);

  // Today's saved state (for undoing today) + Mastered review walk.
  const [daily, setDaily] = useState(() => loadDaily());
  const [reviewWalkId, setReviewWalkId] = useState(0); // new id = fresh review walk
  const updateDaily = fn => setDaily(prev => {
    const next = fn(prev);
    if (next !== prev) saveDaily(next);
    return next;
  });

  // Study sets: fixed sets of 20 words and their progress.
  const studySets = useMemo(() => buildStudySets(WORDS), []);
  const [setProgress, setSetProgress] = useState(loadProgress);
  const progressRef = useRef(setProgress);
  progressRef.current = setProgress;
  const updateSetProgress = (number, fn) => {
    const before = progressRef.current[number];
    updateDaily(d => noteSet(d, number, before));
    const next = fn(progressRef.current);
    progressRef.current = next;
    setSetProgress(next);
    if (!saveProgress(next)) setToast("Couldn't save — this browser is blocking storage (private mode?).");
  };
  const openSet = number => {
    if (statusOf(progressRef.current[number]) === 'untouched') updateSetProgress(number, m => startSet(m, number));
    navigate(`/set/${number}`);
  };

  const grade = (word, remembered) => {
    const before = stagesRef.current[word.lower]; // read now; the updater below runs later
    updateDaily(d => noteReview(d, word, before));
    updateStages(m => gradeReview(m, word, remembered));
  };

  // Resets only today: today's study-set progress and Mastered reviews go back to
  // how they were this morning. Word stages, spelling progress and everything else stay.
  const clearProgress = () => {
    if (!window.confirm("Clear today's progress? Today's study-set rounds and Mastered reviews are undone. Word stages and everything else stay.")) return;
    updateStages(m => undoReviews(m, daily.reviewed));
    const restored = { ...progressRef.current };
    for (const [n, rec] of Object.entries(daily.setsBefore)) {
      if (rec) restored[n] = rec; else delete restored[n];
    }
    progressRef.current = restored;
    setSetProgress(restored);
    saveProgress(restored);
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
    setDaily(loadDaily());
    setSetProgress({});
    progressRef.current = {};
    setDataVersion(v => v + 1);
    setToast('Saved data cleared.');
  };

  // A practice set is a filter over stage, letter and rarity (see sets.js).
  const stageOfWord = useCallback(w => stages[w.lower]?.stage || 'new', [stages]);
  const practiceSet = useMemo(
    () => buildSet(setId, WORDS, stageOfWord, letters) || buildSet('all', WORDS, stageOfWord, letters),
    [setId, stageOfWord, letters]);
  // The set named in the URL for #/browse/<set>, #/spell/<set> and #/pick/<set>.
  const routeSet = useMemo(() => buildSet(param, WORDS, stageOfWord, letters), [param, stageOfWord, letters]);
  const pickerProps = { words: WORDS, stageOf: stageOfWord, letters };

  const changeSet = id => { setSetId(id); store(SET_KEY, id); };

  // Which screen the URL points to; anything unknown goes back to Home.
  const screen =
    page === '' ? 'home'
    : page === 'browse' && routeSet ? 'browse'
    : page === 'spell' && routeSet ? 'spell'
    : page === 'pick' && routeSet ? 'pick'
    : page === 'sets' ? 'sets'
    : page === 'set' && studySets.some(x => String(x.number) === param) ? 'set'
    : page === 'today' && param === 'review' ? 'today-review'
    : null;

  useEffect(() => {
    if (!screen) navigate('/', { replace: true });
  }, [screen]);

  // Opening an Untouched set (e.g. from its link) starts it today.
  useEffect(() => {
    if (screen === 'set' && statusOf(progressRef.current[param]) === 'untouched') {
      updateSetProgress(param, m => startSet(m, param));
    }
  }, [screen, param]); // eslint-disable-line react-hooks/exhaustive-deps

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
      sets: 'Study sets',
      set: `Set ${param}`,
      'today-review': 'Mastered review',
    };
    document.title = titles[screen] ? `${titles[screen]} — Vocab Trainer` : 'Vocab Trainer';
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mastered review: words due today plus the ones already reviewed today.
  const masteredWords = WORDS.filter(w => stageOfWord(w) === 'mastered');
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
  // Today's study-set tasks.
  const setsDue = studySets.filter(x => isDueSet(setProgress[x.number])).map(x => x.number);
  const setsLearning = studySets.filter(x => isLearningToday(setProgress[x.number]))
    .map(x => ({ number: x.number, rounds: roundsToday(setProgress[x.number]) }));
  const nextNew = studySets.find(x => statusOf(setProgress[x.number]) === 'untouched')?.number || null;
  const setsCompleted = studySets.filter(x => statusOf(setProgress[x.number]) === 'completed').length;
  const studySet = screen === 'set' ? studySets.find(x => String(x.number) === param) : null;

  return (
    <main className="app">
      <header className="top">
        <h1><a href={href('/')}>Vocab Trainer</a></h1>
        <span className="muted">{WORDS.length} words</span>
      </header>

      {screen === 'home' && (
        <Home
          picker={pickerProps}
          onSetChange={changeSet}
          practiceSet={practiceSet}
          quizSaved={quizSaved}
          onPick={id => navigate(`/${id}/${practiceSet.id}`)}
          today={{
            learning: setsLearning,
            due: setsDue,
            nextNew,
            completed: setsCompleted,
            totalSets: studySets.length,
            onOpenSet: openSet,
            onAllSets: () => navigate('/sets'),
            masteredCount: masteredWords.length,
            reviewDue: reviewWords.length - reviewDoneSet.size,
            reviewDone: reviewDoneSet.size,
            nextDue: nextDueEntry ? dueLabel(nextDueEntry).replace('review ', '') : '',
            onStartReview: () => { setReviewWalkId(i => i + 1); navigate('/today/review'); },
            hasProgress: Object.keys(daily.setsBefore).length > 0 || reviewDoneSet.size > 0,
            onClear: clearProgress,
          }}
          onClearToday={clearProgress}
          onClearData={clearData}
          dataVersion={dataVersion}
          hasWords={WORDS.length > 0}
        />
      )}
      {screen === 'sets' && (
        <SetList
          sets={studySets}
          progress={setProgress}
          onOpen={openSet}
          onStatus={(n, st) => updateSetProgress(n, m => setStatus(m, n, st))}
          onBack={goHome}
        />
      )}
      {screen === 'set' && studySet && (
        <SetStudy
          key={studySet.number}
          set={studySet}
          rec={setProgress[studySet.number]}
          onRoundDone={n => updateSetProgress(n, m => finishRound(m, n))}
          onBack={goHome}
          onAllSets={() => navigate('/sets')}
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
          picker={pickerProps}
          set={routeSet}
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
