// Pronounces words with the browser's built-in text-to-speech (Web Speech API).
export const CAN_SPEAK = typeof window !== 'undefined' && 'speechSynthesis' in window;

const VOICE_KEY = 'vocab.voice';

// macOS ships joke voices tagged en-US; never pick these automatically.
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|pipe organ|fred|junior|kathy|ralph|princess|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;

// Higher score = better default. Neural / premium voices sound far more natural.
function score(v) {
  let s = 0;
  if (/natural|neural|premium|enhanced|online/i.test(v.name)) s += 100;
  if (/^google (us|uk) english/i.test(v.name)) s += 70;
  if (/samantha|alex|ava|allison|susan|tom|daniel|karen|moira|serena|zoe|evan|nathan|aria|jenny|guy|libby|sonia|ryan/i.test(v.name)) s += 50;
  if (v.lang === 'en-US') s += 20;
  else if (v.lang === 'en-GB') s += 15;
  else if (v.lang?.startsWith('en')) s += 5;
  return s;
}

/** English voices available on this device, best first. */
export function englishVoices() {
  if (!CAN_SPEAK) return [];
  return window.speechSynthesis.getVoices()
    .filter(v => v.lang?.toLowerCase().startsWith('en') && !NOVELTY.test(v.name))
    .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
}

function savedVoiceName() {
  try { return localStorage.getItem(VOICE_KEY); } catch { return null; }
}

export function setVoiceName(name) {
  try { name ? localStorage.setItem(VOICE_KEY, name) : localStorage.removeItem(VOICE_KEY); } catch { /* storage unavailable */ }
}

/** The chosen voice, or the best available one. */
export function currentVoice() {
  const voices = englishVoices();
  const saved = savedVoiceName();
  return voices.find(v => v.name === saved) || voices[0] || null;
}

/** Calls fn whenever the browser's voice list loads or changes. Returns an unsubscribe. */
export function onVoicesChanged(fn) {
  if (!CAN_SPEAK) return () => {};
  window.speechSynthesis.addEventListener?.('voiceschanged', fn);
  return () => window.speechSynthesis.removeEventListener?.('voiceschanged', fn);
}

export function speak(text) {
  if (!CAN_SPEAK || !text) return;
  window.speechSynthesis.cancel(); // stop anything still playing
  const u = new SpeechSynthesisUtterance(text);
  const voice = currentVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang || 'en-US';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}
