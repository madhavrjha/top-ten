"""Lists words saved in a ReadEra backup that aren't in the app yet, with the
book sentence where each was saved.

  .venv/bin/python scripts/readera.py <backup.bak> [letter] [--json out.json]

A ReadEra .bak is a zip with library.json; its "words" list holds each saved
word (data.word_key) and the sentences it was saved from (ctxs[].ctx_title).
"""
import glob, json, os, re, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def clean(word):
    w = word.strip().lower().replace('’', "'")
    return re.sub(r"'s$", '', w)  # "widow's" → "widow"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    out = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
    if out in args:
        args.remove(out)
    backup, letter = args[0], (args[1].lower() if len(args) > 1 else None)

    with zipfile.ZipFile(backup) as z:
        library = json.loads(z.read('library.json'))
    have = {w['word'].lower() for f in glob.glob(os.path.join(ROOT, 'src/words/*.json'))
            for w in json.load(open(f))}

    found = {}
    for entry in library.get('words', []):
        word = clean(entry['data'].get('word_key') or entry['data'].get('word_title') or '')
        if not word or word in have or (letter and not word.startswith(letter)):
            continue
        sentences = [c['ctx_title'].strip() for c in entry.get('ctxs', []) if c.get('ctx_title')]
        found.setdefault(word, []).extend(s for s in sentences if s not in found.get(word, []))

    words = [{'word': w, 'sentences': found[w]} for w in sorted(found)]
    if out:
        json.dump(words, open(out, 'w'), indent=1, ensure_ascii=False)
        print(f'{len(words)} new words written to {out}')
    else:
        for w in words:
            print(w['word'], '|', w['sentences'][0] if w['sentences'] else '')
        print(f'{len(words)} new words')


main()
