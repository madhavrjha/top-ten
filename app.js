const ROUND_SIZE = 10;
const OPTION_COUNT = 4;
const WORDS = window.WORDS || [];

const $ = id => document.getElementById(id);
const screens = ['home', 'quiz', 'done', 'browse'];

const state = {
  level: 1,
  pool: [],      // words not yet put into a round this session
  round: [],     // the current round's words
  queue: [],     // words still to answer in this round (missed ones get re-added)
  cleared: 0,    // words answered correctly in this round
  roundNum: 0,
  current: null,
  answered: false,
  hintStep: 0,
};

function show(name) {
  screens.forEach(s => $(s).classList.toggle('hidden', s !== name));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function detailsHtml(w) {
  return `
    <div class="details">
      <h3>${esc(w.word)}</h3>
      <p><span class="label">Meaning:</span> ${esc(w.meaning)}</p>
      ${w.trick ? `<p><span class="label">Trick:</span> ${esc(w.trick)}</p>` : ''}
      ${w.examples.length ? `<ul>${w.examples.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
    </div>`;
}

/* ---------- Session / rounds ---------- */

function startSession(level) {
  if (!WORDS.length) {
    alert('No words found. Add JSON files to words/ and run: node build.js');
    return;
  }
  state.level = level;
  state.pool = shuffle(WORDS);
  state.roundNum = 0;
  startRound();
}

function startRound() {
  state.round = state.pool.splice(0, ROUND_SIZE);
  state.queue = shuffle(state.round);
  state.cleared = 0;
  state.roundNum++;
  show('quiz');
  nextQuestion();
}

function nextQuestion() {
  if (!state.queue.length) return finishRound();
  state.current = state.queue.shift();
  state.answered = false;
  state.hintStep = 0;
  renderProgress();

  $('feedback').className = 'feedback hidden';
  $('next-btn').classList.add('hidden');

  if (state.level === 1) renderMeaningQuestion();
  else renderSpellQuestion();
}

function renderProgress() {
  const totalRounds = state.roundNum + Math.ceil(state.pool.length / ROUND_SIZE);
  $('round-label').textContent = `Level ${state.level} · Round ${state.roundNum} of ${totalRounds}`;
  $('cleared-label').textContent = `${state.cleared} / ${state.round.length} cleared`;
  $('bar-fill').style.width = `${(state.cleared / state.round.length) * 100}%`;
}

function handleResult(correct) {
  state.answered = true;
  const w = state.current;
  if (correct) {
    state.cleared++;
  } else {
    // Put the missed word back a few spots later so it comes around again.
    const pos = Math.min(state.queue.length, 2 + Math.floor(Math.random() * 3));
    state.queue.splice(pos, 0, w);
  }
  renderProgress();

  const fb = $('feedback');
  fb.className = `feedback ${correct ? 'good' : 'bad'}`;
  fb.innerHTML = `<div class="verdict">${correct ? 'Correct!' : 'Not quite — this one will come back.'}</div>${detailsHtml(w)}`;
  $('next-btn').classList.remove('hidden');
  $('next-btn').focus();
}

function finishRound() {
  const more = state.pool.length > 0;
  $('done-title').textContent = more ? `Round ${state.roundNum} cleared!` : 'All words cleared! 🎉';
  $('done-text').textContent = more
    ? `${state.pool.length} word${state.pool.length === 1 ? '' : 's'} left in this session.`
    : `You cleared all ${WORDS.length} words at Level ${state.level}.`;
  $('continue-btn').textContent = more ? 'Next round' : 'Play again';
  $('continue-btn').onclick = more ? startRound : () => startSession(state.level);
  show('done');
  $('continue-btn').focus();
}

/* ---------- Level 1: pick the meaning ---------- */

function renderMeaningQuestion() {
  const w = state.current;
  $('prompt-kind').textContent = 'What does this word mean?';
  $('prompt').className = 'prompt';
  $('prompt').textContent = w.word;
  $('spell-form').classList.add('hidden');
  $('hint-row').classList.add('hidden');

  // Distractors must have distinct meanings so there's only one right answer.
  const seen = new Set([norm(w.meaning)]);
  const others = shuffle(WORDS).filter(x => {
    const m = norm(x.meaning);
    if (seen.has(m)) return false;
    seen.add(m);
    return true;
  }).slice(0, OPTION_COUNT - 1);
  const choices = shuffle([w, ...others]);

  const box = $('options');
  box.classList.remove('hidden');
  box.innerHTML = '';
  choices.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${i + 1}. ${c.meaning}`;
    b.dataset.word = c.word;
    b.onclick = () => pickMeaning(b);
    box.appendChild(b);
  });
}

function pickMeaning(btn) {
  if (state.answered) return;
  const correct = btn.dataset.word === state.current.word;
  [...$('options').children].forEach(b => {
    b.disabled = true;
    if (b.dataset.word === state.current.word) b.classList.add('correct');
  });
  if (!correct) btn.classList.add('wrong');
  handleResult(correct);
}

/* ---------- Level 2: spell the word ---------- */

function renderSpellQuestion() {
  const w = state.current;
  $('prompt-kind').textContent = 'Type the word that means…';
  $('prompt').className = 'prompt meaning';
  $('prompt').textContent = w.meaning;
  $('options').classList.add('hidden');

  $('spell-form').classList.remove('hidden');
  const input = $('spell-input');
  input.value = '';
  input.disabled = false;
  input.focus();

  $('hint-row').classList.remove('hidden');
  $('hint').innerHTML = '';
  $('hint-btn').disabled = false;
  $('hint-btn').textContent = 'Show hint';
}

function letterHint(word, revealed) {
  return [...word].map((ch, i) => (i < revealed || ch === ' ' || ch === '-' ? ch : '_')).join(' ');
}

function showHint() {
  const w = state.current;
  state.hintStep++;
  const parts = [];
  // Step 1: memory trick (with the word itself masked). Step 2+: reveal letters one by one.
  if (w.trick) {
    const masked = w.trick.replace(new RegExp(w.word, 'gi'), '____');
    parts.push(`<div>💡 ${esc(masked)}</div>`);
  }
  const lettersShown = w.trick ? state.hintStep - 1 : state.hintStep;
  if (lettersShown > 0 || !w.trick) {
    parts.push(`<div class="letters">${esc(letterHint(w.word, Math.max(1, lettersShown)))}</div>`);
  }
  $('hint').innerHTML = parts.join('');
  $('hint-btn').textContent = 'More hint';
  if (lettersShown >= w.word.length - 1) $('hint-btn').disabled = true;
  $('spell-input').focus();
}

function checkSpelling(e) {
  e.preventDefault();
  if (state.answered) return;
  const typed = $('spell-input').value.trim().toLowerCase();
  if (!typed) return;
  // Accept any word that shares the exact same meaning (e.g. amiable / amiably).
  const meaning = norm(state.current.meaning);
  const correct = typed === state.current.word.toLowerCase() ||
    WORDS.some(x => norm(x.meaning) === meaning && x.word.toLowerCase() === typed);
  $('spell-input').disabled = true;
  $('hint-btn').disabled = true;
  handleResult(correct);
  if (!correct) {
    $('feedback').querySelector('.verdict').insertAdjacentHTML(
      'afterend', `<p>You typed <strong>${esc(typed)}</strong></p>`);
  }
}

/* ---------- Browse ---------- */

function renderBrowse() {
  const q = $('search').value.trim().toLowerCase();
  const list = WORDS
    .filter(w => !q || w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q))
    .sort((a, b) => a.word.localeCompare(b.word));
  $('word-list').innerHTML = list.length
    ? list.map(w => `<div class="card">${detailsHtml(w)}</div>`).join('')
    : '<p class="muted center">No matching words.</p>';
}

/* ---------- Wiring ---------- */

document.querySelectorAll('.level-card').forEach(card => {
  card.onclick = () => {
    const lvl = card.dataset.level;
    if (lvl === 'browse') {
      $('search').value = '';
      renderBrowse();
      show('browse');
      $('search').focus();
    } else {
      startSession(Number(lvl));
    }
  };
});

$('spell-form').addEventListener('submit', checkSpelling);
$('hint-btn').onclick = showHint;
$('next-btn').onclick = nextQuestion;
$('quit-btn').onclick = () => show('home');
$('home-btn').onclick = () => show('home');
$('browse-back').onclick = () => show('home');
$('home-link').onclick = () => show('home');
$('search').addEventListener('input', renderBrowse);

document.addEventListener('keydown', e => {
  if ($('quiz').classList.contains('hidden')) return;
  if (state.answered && e.key === 'Enter') {
    e.preventDefault();
    nextQuestion();
  } else if (!state.answered && state.level === 1 && /^[1-9]$/.test(e.key)) {
    const btn = $('options').children[Number(e.key) - 1];
    if (btn) pickMeaning(btn);
  }
});

$('word-count').textContent = `${WORDS.length} words`;
show('home');
