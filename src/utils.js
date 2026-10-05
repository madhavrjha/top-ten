export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

// Normalizes raw word entries once at load time and precomputes the
// lowercase word and meaning key used by the quiz.
export function prepareWords(list) {
  return list
    .filter(w => w && w.word && w.meaning)
    .map(w => {
      const word = w.word.trim();
      const meaning = w.meaning.trim();
      return {
        word,
        meaning,
        trick: (w.trick || '').trim(),
        examples: Array.isArray(w.examples) ? w.examples : [],
        usage: w.usage && w.usage.pattern ? {
          pos: w.usage.pos || '',
          pattern: w.usage.pattern,
          partners: Array.isArray(w.usage.partners) ? w.usage.partners : [],
        } : null,
        lower: word.toLowerCase(),
        key: norm(meaning),
      };
    })
    .sort((a, b) => a.word.localeCompare(b.word));
}
