import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';

const WORDS_DIR = path.resolve('src/words');
const LEVELS = ['easy', 'medium', 'hard'];

// Dev-server endpoint that saves a word's difficulty back into its letter file:
//   POST /api/level  { "word": "agony", "level": "hard" | "medium" | "easy" | null }
function wordLevels() {
  const selfWrites = new Map(); // file → time we last wrote it
  let queue = Promise.resolve(); // one write at a time, so rapid clicks don't race

  async function saveLevel(word, level) {
    const key = word.trim().toLowerCase();
    const file = path.join(WORDS_DIR, `${key[0]}.json`);
    const text = await fs.readFile(file, 'utf8').catch(() => null);
    if (text === null) throw new Error(`"${word}" not found (no ${path.basename(file)})`);
    const list = JSON.parse(text);
    const entry = list.find(w => w.word.trim().toLowerCase() === key);
    if (!entry) throw new Error(`"${word}" not found in ${path.basename(file)}`);
    if (level) entry.level = level;
    else delete entry.level;
    selfWrites.set(file, Date.now());
    await fs.writeFile(file, JSON.stringify(list, null, 2) + '\n');
  }

  return {
    name: 'word-levels',
    configureServer(server) {
      server.middlewares.use('/api/level', (req, res) => {
        const send = (status, body) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return send(405, { error: 'POST only' });

        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
          let word, level;
          try {
            ({ word, level } = JSON.parse(body));
          } catch {
            return send(400, { error: 'Invalid JSON' });
          }
          if (typeof word !== 'string' || !word.trim()) return send(400, { error: 'Missing word' });
          if (level !== null && !LEVELS.includes(level)) return send(400, { error: 'Invalid level' });

          queue = queue
            .then(() => saveLevel(word, level))
            .then(() => send(200, { ok: true }), err => send(500, { error: err.message }));
        });
      });
    },
    // Our own writes shouldn't reload the page mid-quiz (the app already shows
    // the change). Edits made by hand, like adding new words, still reload.
    hotUpdate({ file }) {
      const t = selfWrites.get(path.resolve(file));
      if (t && Date.now() - t < 2000) return [];
    },
  };
}

export default defineConfig({
  plugins: [react(), wordLevels()],
});
