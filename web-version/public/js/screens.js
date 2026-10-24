// screens.js - the menu screens: login, register, main menu, level select, high scores, how to play.
// They are ordinary HTML elements shown on top of the 3D reef, which keeps drawing behind them.
// This module only shows screens and talks to api.js; it knows nothing about the 3D game.


import * as api from './api.js';
import { LEVELS } from './levels.js'; // only the names and gate counts are used here

const screenNames = ['login', 'register', 'menu', 'levels', 'scores', 'help'];
const screenEls = {};
for (const name of screenNames) {
  screenEls[name] = document.getElementById(`screen-${name}`);
}

const loginForm = document.getElementById('login-form');
const loginUser = document.getElementById('login-username');
const loginPass = document.getElementById('login-password');
const loginRemember = document.getElementById('login-remember');
const loginMessage = document.getElementById('login-message');
const registerForm = document.getElementById('register-form');
const registerUser = document.getElementById('register-username');
const registerPass = document.getElementById('register-password');
const registerConfirm = document.getElementById('register-confirm');
const registerMessage = document.getElementById('register-message');
const menuUser = document.getElementById('menu-user');
const levelsList = document.getElementById('levels-list');
const levelsNote = document.getElementById('levels-note');
const scoresTabs = document.getElementById('scores-tabs');
const scoresHead = document.getElementById('scores-head');
const scoresBody = document.getElementById('scores-body');
const scoresNote = document.getElementById('scores-note');

let currentUser = null;
let playCallback = null; // called with the level number (0, 1, 2...) when the player picks a level

/** Shows one screen. showScreen(null) shows only the game. */
export function showScreen(name) {
  for (const key of screenNames) {
    screenEls[key].classList.toggle('visible', key === name);
  }
  document.body.classList.toggle('in-game', name === null);
  if (name === 'login') {
    loginPass.value = '';
    loginUser.focus();
  }
}

function setUser(username) {
  currentUser = username;
  menuUser.textContent = username ? `Signed in as ${username}` : '';
}

function setMessage(element, text, good) {
  element.textContent = text;
  element.className = good ? 'message good' : 'message';
}

function textElement(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text; // textContent, never innerHTML: everything is shown as plain text
  return element;
}

// ---------------------------------------------------------------- level select

/** Shows one card per level. Levels the player has not unlocked yet are greyed out. */
export async function openLevelSelect() {
  showScreen('levels');
  levelsList.textContent = '';
  levelsNote.textContent = 'Loading...';
  try {
    const progress = await api.getProgress();
    LEVELS.forEach((def, index) => {
      const number = index + 1;
      const locked = number > progress.unlocked;
      const best = progress.bests[index];

      const card = document.createElement('button');
      card.type = 'button';
      card.className = locked ? 'level-card locked' : 'level-card';
      card.disabled = locked;
      let info = `${def.walls.length} gates`;
      if (locked) {
        info += ' - finish the previous level to unlock';
      } else if (best === null) {
        info += ' - not finished yet';
      } else {
        info += ` - best score ${best}`;
      }
      card.append(textElement('strong', `Level ${number}: ${def.name}`), textElement('span', info));
      card.addEventListener('click', () => playCallback(index)); // EVENT: a level card was clicked
      levelsList.appendChild(card);
    });
    levelsNote.textContent = '';
  } catch (error) {
    levelsNote.textContent = error.message;
  }
}

// ---------------------------------------------------------------- high scores

function buildScoreTabs() {
  scoresTabs.textContent = '';
  const tabs = LEVELS.map((def, i) => ({ key: i + 1, label: `Level ${i + 1}` }));
  tabs.push({ key: 'all', label: 'Overall' });
  for (const tab of tabs) {
    const button = textElement('button', tab.label);
    button.type = 'button';
    button.className = 'tab';
    button.dataset.tab = String(tab.key);
    button.addEventListener('click', () => openScores(tab.key)); // EVENT: a tab was clicked
    scoresTabs.appendChild(button);
  }
}

/** Opens the high score table. tab is a level number (1, 2, 3...) or 'all' for the overall table. */
export async function openScores(tab = 1) {
  showScreen('scores');
  for (const button of scoresTabs.children) {
    button.classList.toggle('active', button.dataset.tab === String(tab));
  }
  const overall = tab === 'all';
  scoresHead.textContent = '';
  for (const label of ['Rank', 'Player', overall ? 'Total' : 'Score', overall ? 'Levels' : 'Time']) {
    scoresHead.appendChild(textElement('th', label));
  }
  scoresBody.textContent = '';
  scoresNote.textContent = 'Loading...';
  try {
    const data = await api.getScores(tab);
    for (const entry of data.scores) {
      const row = document.createElement('tr');
      if (currentUser && entry.username.toLowerCase() === currentUser.toLowerCase()) {
        row.className = 'me';
      }
      const last = overall ? `${entry.levels} of ${LEVELS.length}` : `${entry.seconds}s`;
      for (const value of [entry.rank, entry.username, entry.score, last]) {
        row.appendChild(textElement('td', String(value)));
      }
      scoresBody.appendChild(row);
    }
    if (data.scores.length === 0) {
      scoresNote.textContent = 'No scores yet. Be the first to reach the treasure!';
    } else if (data.me) {
      scoresNote.textContent = overall
        ? `Your total: ${data.me.score} points (rank ${data.me.rank}).`
        : `Your best: ${data.me.score} points (rank ${data.me.rank}).`;
    } else {
      scoresNote.textContent = 'You have no saved score here yet.';
    }
  } catch (error) {
    scoresNote.textContent = error.message;
  }
}

// ---------------------------------------------------------------- start and buttons

/** After the page loads: go to the menu if the cookie is still valid, otherwise to the login. */
export async function showStart() {
  try {
    const me = await api.getMe();
    setUser(me.username);
    showScreen('menu');
  } catch {
    setUser(null);
    showScreen('login');
  }
}

/** Connects the buttons and forms. onPlay(levelIndex) and onLogout() are called by the main game. */
export function initScreens({ onPlay, onLogout }) {
  playCallback = onPlay;
  buildScoreTabs();

  // EVENT: login form submitted (button or Enter key)
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(loginMessage, 'Logging in...', true);
    try {
      const result = await api.login(loginUser.value.trim(), loginPass.value, loginRemember.checked);
      setUser(result.username);
      setMessage(loginMessage, '', false);
      showScreen('menu');
    } catch (error) {
      setMessage(loginMessage, error.message, false);
    }
    loginPass.value = '';
  });

  document.getElementById('go-register').addEventListener('click', () => {
    setMessage(registerMessage, '', false);
    showScreen('register');
    registerUser.focus();
  });
  document.getElementById('go-login').addEventListener('click', () => showScreen('login'));

  // EVENT: register form submitted
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (registerPass.value !== registerConfirm.value) {
      setMessage(registerMessage, 'The two passwords do not match.', false);
      return;
    }
    try {
      const result = await api.register(registerUser.value.trim(), registerPass.value);
      registerPass.value = '';
      registerConfirm.value = '';
      loginUser.value = result.username;
      showScreen('login');
      setMessage(loginMessage, 'Account created! Please log in.', true);
      loginPass.focus();
    } catch (error) {
      setMessage(registerMessage, error.message, false);
    }
  });

  // EVENT: menu buttons
  document.getElementById('menu-play').addEventListener('click', openLevelSelect);
  document.getElementById('menu-scores').addEventListener('click', () => openScores(1));
  document.getElementById('menu-help').addEventListener('click', () => showScreen('help'));
  document.getElementById('menu-logout').addEventListener('click', async () => {
    try {
      await api.logout();
    } catch {
      // even if the server cannot be reached, show the login screen
    }
    setUser(null);
    onLogout();
    setMessage(loginMessage, '', false);
    showScreen('login');
  });
  document.getElementById('levels-back').addEventListener('click', () => showScreen('menu'));
  document.getElementById('scores-back').addEventListener('click', () => showScreen('menu'));
  document.getElementById('help-back').addEventListener('click', () => showScreen('menu'));
}
