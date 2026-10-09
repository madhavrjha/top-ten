"""Writes src/studysets.json: every word split into fixed study sets of 20,
most common first (by src/frequency.json). Existing sets never change; words
not in any set yet (newly imported) are added as new sets at the end.

Run after adding words (after scripts/frequency.py):  python3 scripts/make_sets.py
"""
import glob, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src/studysets.json')
SIZE = 20

words = {w['word'].lower() for f in glob.glob(os.path.join(ROOT, 'src/words/*.json')) for w in json.load(open(f))}
freq = json.load(open(os.path.join(ROOT, 'src/frequency.json')))

sets = json.load(open(OUT))['sets'] if os.path.exists(OUT) else []
# Drop words that no longer exist, keep everything else exactly where it is.
sets = [[w for w in s if w in words] for s in sets]
placed = {w for s in sets for w in s}
new = sorted(words - placed, key=lambda w: (-freq.get(w, 0), w))
# Top up a short last set first, then add new sets.
if sets and len(sets[-1]) < SIZE:
    take = SIZE - len(sets[-1])
    sets[-1] += new[:take]
    new = new[take:]
sets += [new[i:i + SIZE] for i in range(0, len(new), SIZE)]

with open(OUT, 'w') as f:
    json.dump({'size': SIZE, 'sets': sets}, f, indent=0, ensure_ascii=False)
    f.write('\n')
print(f'{len(sets)} sets, {sum(map(len, sets))} words ({len(new)} newly placed)')
