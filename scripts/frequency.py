"""Writes src/frequency.json: how common each word is, as a Zipf score
(1 = very rare … 7 = extremely common), from the wordfreq library.

Run after adding words:  .venv/bin/python scripts/frequency.py
(one-time setup: python3 -m venv .venv && .venv/bin/pip install wordfreq)
"""
import glob, json, os, re
from wordfreq import zipf_frequency

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def score(word):
    parts = [p for p in re.split(r"[\s-]+", word.lower()) if p]
    if len(parts) == 1:
        return zipf_frequency(parts[0], 'en')
    # Phrases and hyphenated words: wordfreq has no counts for the whole phrase,
    # so estimate it as the rarest part, one step rarer.
    return max(0.0, min(zipf_frequency(p, 'en') for p in parts) - 1)


words = sorted({w['word'].lower()
                for f in glob.glob(os.path.join(ROOT, 'src/words/*.json'))
                for w in json.load(open(f))})
out = {w: round(score(w), 2) for w in words}
with open(os.path.join(ROOT, 'src/frequency.json'), 'w') as f:
    json.dump(out, f, indent=0, ensure_ascii=False)
    f.write('\n')
print(f'{len(out)} words scored')
