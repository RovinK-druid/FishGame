// server.js - Fish Counter web server (Day 3)
//
// 1. Serves the game files to the browser.
// 2. Offers a small JSON API for the game:
//      POST /api/puzzle              -> gets a new puzzle from the Fish Game API and returns
//                                       { id, image }   (the answer is NOT sent)
//      POST /api/puzzle/:id/answer   -> body { guess: 0-9 }, returns { correct: true/false }
// Later days add login and saved scores here.
//
// Written with help from Claude (AI assistant).

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchFishPuzzle } from './services/fishApi.js';
import { PuzzleStore } from './services/puzzleStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const puzzles = new PuzzleStore();

app.use(express.json()); // lets routes read JSON sent by the browser

// The game itself: HTML, CSS and JavaScript in the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Three.js is installed with npm and served from node_modules,
// so the game does not need any outside CDN.
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/vendor/three-addons', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));

// ---- puzzle routes ----

app.post('/api/puzzle', async (req, res) => {
  try {
    const puzzle = await fetchFishPuzzle(); // server -> Fish Game API
    const id = puzzles.create(puzzle.solution);
    res.json({ id, image: `data:${puzzle.mime};base64,${puzzle.imageBase64}` });
  } catch (error) {
    console.error('Fish API problem:', error.message);
    res.status(502).json({ error: 'The Fish puzzle service is not available right now.' });
  }
});

app.post('/api/puzzle/:id/answer', (req, res) => {
  const guess = req.body?.guess;
  if (!Number.isInteger(guess) || guess < 0 || guess > 9) {
    return res.status(400).json({ error: 'The answer must be a whole number from 0 to 9.' });
  }
  const result = puzzles.check(req.params.id, guess);
  if (!result.found) {
    return res.status(404).json({ error: 'That puzzle has expired. Please try the gate again.' });
  }
  res.json({ correct: result.correct });
});

// anything unexpected (for example broken JSON) gets a short JSON reply
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ error: 'Bad request.' });
});

app.listen(PORT, () => {
  console.log(`Fish Counter is running at http://localhost:${PORT}`);
});
