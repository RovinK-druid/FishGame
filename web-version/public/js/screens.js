// screens.js - the menu screens: login, register, main menu, high scores and how to play.
// They are ordinary HTML elements shown on top of the 3D reef, which keeps drawing behind them.
// This module only shows screens and talks to api.js; it knows nothing about the 3D game.


import * as api from './api.js';

const screenNames = ['login', 'register', 'menu', 'scores', 'help'];
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
const scoresBody = document.getElementById('scores-body');
const scoresNote = document.getElementById('scores-note');

let currentUser = null;

/** Shows one screen (login, register, menu, scores, help). showScreen(null) shows only the game. */
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

/** Opens the high score table (also used by the "Treasure found" box). */
export async function openScores() {
  showScreen('scores');
  scoresBody.textContent = '';
  scoresNote.textContent = 'Loading...';
  try {
    const data = await api.getScores();
    for (const entry of data.scores) {
      const row = document.createElement('tr');
      if (currentUser && entry.username.toLowerCase() === currentUser.toLowerCase()) {
        row.className = 'me';
      }
      for (const value of [entry.rank, entry.username, entry.score, `${entry.seconds}s`]) {
        const cell = document.createElement('td');
        cell.textContent = String(value); // textContent, never innerHTML: names are shown as plain text
        row.appendChild(cell);
      }
      scoresBody.appendChild(row);
    }
    if (data.scores.length === 0) {
      scoresNote.textContent = 'No scores yet. Be the first to reach the treasure!';
    } else if (data.me) {
      scoresNote.textContent = `Your best: ${data.me.score} points (rank ${data.me.rank}).`;
    } else {
      scoresNote.textContent = 'You have no saved score yet.';
    }
  } catch (error) {
    scoresNote.textContent = error.message;
  }
}

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

/** Connects the buttons and forms. onPlay and onLogout are called by the main game. */
export function initScreens({ onPlay, onLogout }) {
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
  document.getElementById('menu-play').addEventListener('click', onPlay);
  document.getElementById('menu-scores').addEventListener('click', openScores);
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
  document.getElementById('scores-back').addEventListener('click', () => showScreen('menu'));
  document.getElementById('help-back').addEventListener('click', () => showScreen('menu'));
}
