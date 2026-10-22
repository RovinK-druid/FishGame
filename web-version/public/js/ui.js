// ui.js - the text on top of the 3D scene while playing (status, hints, result boxes).
// It only changes the web page; it contains no game rules.


const statusEl = document.getElementById('status');
const messageEl = document.getElementById('message');
const flashEl = document.getElementById('damage-flash');
const overlayEl = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const overlayScore = document.getElementById('overlay-score');
const restartButton = document.getElementById('restart');
const scoresButton = document.getElementById('complete-scores');
const menuButton = document.getElementById('complete-menu');
const deadEl = document.getElementById('dead');
const deadText = document.getElementById('dead-text');
const deadRetry = document.getElementById('dead-retry');
const deadMenu = document.getElementById('dead-menu');

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function setStatus(lives, gatesOpened, gatesTotal, mistakes, seconds) {
  const hearts = lives > 0 ? '\u2665 '.repeat(lives).trim() : '-';
  statusEl.textContent =
    `Lives ${hearts}   |   Gates ${gatesOpened}/${gatesTotal}   |   Mistakes ${mistakes}   |   Time ${formatTime(seconds)}`;
}

export function showMessage(text) {
  messageEl.textContent = text;
  messageEl.classList.add('visible');
}

export function hideMessage() {
  messageEl.classList.remove('visible');
}

/** A quick red flash around the screen when the player is hurt. */
export function flashDamage() {
  flashEl.classList.remove('active');
  void flashEl.offsetWidth; // makes the browser restart the animation
  flashEl.classList.add('active');
}

/**
 * Shows the "Treasure found" box. The handlers are called when the buttons are clicked:
 * { onRestart, onScores, onMenu }.
 */
export function showComplete(seconds, mistakes, handlers) {
  const plural = mistakes === 1 ? 'mistake' : 'mistakes';
  overlayText.textContent = `You reached the treasure in ${formatTime(seconds)} with ${mistakes} ${plural}.`;
  overlayScore.textContent = 'Saving your score...';
  overlayEl.classList.add('visible');
  // EVENT: the three buttons of the box
  restartButton.onclick = () => { restartButton.blur(); handlers.onRestart(); };
  scoresButton.onclick = () => { scoresButton.blur(); handlers.onScores(); };
  menuButton.onclick = () => { menuButton.blur(); handlers.onMenu(); };
}

/** Fills in the score line once the server has answered. */
export function setScoreResult(text) {
  overlayScore.textContent = text;
}

export function hideComplete() {
  overlayEl.classList.remove('visible');
}

/** Shows the "game over" box when all lives are lost. handlers: { onRetry, onMenu }. */
export function showDead(text, handlers) {
  deadText.textContent = text;
  deadEl.classList.add('visible');
  // EVENT: the two buttons of the box
  deadRetry.onclick = () => { deadRetry.blur(); handlers.onRetry(); };
  deadMenu.onclick = () => { deadMenu.blur(); handlers.onMenu(); };
}

export function hideDead() {
  deadEl.classList.remove('visible');
}
