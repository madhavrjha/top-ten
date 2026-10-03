# Vocab Trainer

Plain HTML/CSS/JS vocabulary quiz. Open `index.html` directly in a browser.

## Adding words
When the user gives new words:
1. Create one file per word: `words/<word-lowercase>.json`
   ```json
   {
     "word": "ephemeral",
     "meaning": "Lasting for a very short time",
     "trick": "A memorable mnemonic",
     "examples": ["Example sentence one.", "Example sentence two."]
   }
   ```
   If the user doesn't supply a trick or examples, write good ones.
2. Run `node build.js` to regenerate `words-data.js` (never edit that file by hand).

## Files
- `index.html`, `styles.css`, `app.js` — the app (Level 1: pick meaning, Level 2: spell from meaning, Browse)
- `build.js` — bundles `words/*.json` → `words-data.js`
