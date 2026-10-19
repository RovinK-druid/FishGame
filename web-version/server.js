// server.js - Fish Counter web server (Day 4)
//
// 1. Serves the game files to the browser.
// 2. Offers a JSON API:
//      POST /api/register           { username, password }
//      POST /api/login              { username, password, remember }  -> sets the session cookie
//      POST /api/logout
//      GET  /api/me                 -> { username }
//      POST /api/puzzle             -> gets a puzzle from the Fish Game API, returns { id, image }
//      POST /api/puzzle/:id/answer  { guess }  -> { correct }
//      POST /api/scores             { seconds, mistakes } -> saves the score of a finished level
//      GET  /api/scores             -> the high score table
//    Everything except register, login, logout and the static files needs a logged-in player.


import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchFishPuzzle } from './services/fishApi.js';
import { PuzzleStore } from './services/puzzleStore.js';
import { UserStore } from './services/users.js';
import { SessionStore, COOKIE_NAME } from './services/sessions.js';
import { ScoreStore } from './services/scores.js';
import { LoginLimiter } from './services/loginLimiter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data'); // not uploaded to GitHub
const GATES_PER_LEVEL = 2; // a score is only accepted after this many puzzles were solved

const users = new UserStore(DATA_DIR);
const sessions = new SessionStore(DATA_DIR);
const scores = new ScoreStore(DATA_DIR);
const puzzles = new PuzzleStore();
const limiter = new LoginLimiter();
const solvedPuzzles = new Map(); // username -> puzzles solved and not yet "used" by a saved score

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' })); // lets routes read JSON sent by the browser

// The game itself: HTML, CSS and JavaScript in the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Three.js is installed with npm and served from node_modules,
// so the game does not need any outside CDN.
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/vendor/three-addons', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));

// API replies must never be stored by the browser
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ---- cookie helpers (small, so no extra package is needed) ----

function parseCookies(header) {
  const cookies = {};
  for (const part of (header || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) {
      cookies[part.slice(0, index).trim()] = part.slice(index + 1).trim();
    }
  }
  return cookies;
}

function sendSessionCookie(res, token, maxAgeMs) {
  const parts = [`${COOKIE_NAME}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  // HttpOnly: JavaScript in the page cannot read the cookie (protects against stolen sessions).
  // SameSite=Lax: other websites cannot make the browser send it with their forms.
  if (maxAgeMs) {
    parts.push(`Max-Age=${Math.floor(maxAgeMs / 1000)}`); // "remember me": survives closing the browser
  }
  if (process.env.COOKIE_SECURE === 'true') {
    parts.push('Secure'); // only sent over HTTPS (use this when the site is online)
  }
  res.append('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

/** Middleware: only lets logged-in players through. */
function requireLogin(req, res, next) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  const username = sessions.find(token);
  if (!username) {
    return res.status(401).json({ error: 'Please log in.' });
  }
  req.user = username;
  next();
}

// ---- account routes ----

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body ?? {};
  const result = await users.register(username, password);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json({ username: result.username });
});

app.post('/api/login', async (req, res) => {
  const { username, password, remember } = req.body ?? {};
  const key = String(username ?? '').toLowerCase();

  if (limiter.isBlocked(key)) {
    return res.status(429).json({ error: 'Too many wrong passwords. Please wait a few minutes.' });
  }
  const name = await users.verify(username, password);
  if (!name) {
    limiter.recordFailure(key);
    // the same message for "no such user" and "wrong password"
    return res.status(401).json({ error: 'Wrong username or password.' });
  }
  limiter.clear(key);

  const session = sessions.create(name, remember === true);
  sendSessionCookie(res, session.token, session.maxAgeMs);
  res.json({ username: name });
});

app.post('/api/logout', (req, res) => {
  sessions.destroy(parseCookies(req.headers.cookie)[COOKIE_NAME]);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/me', requireLogin, (req, res) => {
  res.json({ username: req.user });
});

// ---- puzzle routes ----

app.post('/api/puzzle', requireLogin, async (req, res) => {
  try {
    const puzzle = await fetchFishPuzzle(); // server -> Fish Game API
    const id = puzzles.create(puzzle.solution, req.user);
    res.json({ id, image: `data:${puzzle.mime};base64,${puzzle.imageBase64}` });
  } catch (error) {
    console.error('Fish API problem:', error.message);
    res.status(502).json({ error: 'The Fish puzzle service is not available right now.' });
  }
});

app.post('/api/puzzle/:id/answer', requireLogin, (req, res) => {
  const guess = req.body?.guess;
  if (!Number.isInteger(guess) || guess < 0 || guess > 9) {
    return res.status(400).json({ error: 'The answer must be a whole number from 0 to 9.' });
  }
  const result = puzzles.check(req.params.id, guess, req.user);
  if (!result.found) {
    return res.status(404).json({ error: 'That puzzle has expired. Please try the gate again.' });
  }
  if (result.correct) {
    solvedPuzzles.set(req.user, (solvedPuzzles.get(req.user) ?? 0) + 1);
  }
  res.json({ correct: result.correct });
});

// ---- score routes ----

app.post('/api/scores', requireLogin, (req, res) => {
  const { seconds, mistakes } = req.body ?? {};
  // never trust the browser: check that the numbers are sensible
  if (!Number.isFinite(seconds) || seconds < 15 || seconds > 3600
      || !Number.isInteger(mistakes) || mistakes < 0 || mistakes > 100) {
    return res.status(400).json({ error: 'That result does not look valid.' });
  }
  // the player must really have solved the gate puzzles on this server
  const solved = solvedPuzzles.get(req.user) ?? 0;
  if (solved < GATES_PER_LEVEL) {
    return res.status(400).json({ error: 'Solve both gate puzzles before saving a score.' });
  }
  solvedPuzzles.set(req.user, solved - GATES_PER_LEVEL);
  res.json(scores.submit(req.user, seconds, mistakes));
});

app.get('/api/scores', requireLogin, (req, res) => {
  res.json({ scores: scores.top(10), me: scores.rankOf(req.user) });
});

// anything unexpected (for example broken JSON) gets a short JSON reply
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ error: 'Bad request.' });
});

app.listen(PORT, () => {
  console.log(`Fish Counter is running at http://localhost:${PORT}`);
});
