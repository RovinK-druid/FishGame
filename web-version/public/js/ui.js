// ui.js - the text on top of the 3D scene while playing (status, hints, result boxes).
// It only changes the web page; it contains no game rules.


const statusEl = document.getElementById('status');
const messageEl = document.getElementById('message');
const flashEl = document.getElementById('damage-flash');
const overlayEl = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayScore = document.getElementById('overlay-score');
const nextButton = document.getElementById('complete-next');
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

export function setStatus(levelNumber, lives, gatesOpened, gatesTotal, mistakes, seconds) {
  const hearts = lives > 0 ? '\u2665 '.repeat(lives).trim() : '-';
  statusEl.textContent = `Level ${levelNumber}   |   Lives ${hearts}   |   Gates ${gatesOpened}/${gatesTotal}`
    + `   |   Mistakes ${mistakes}   |   Time ${formatTime(seconds)}`;
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
 * Shows the result box when a level is finished.
 * info: { levelNumber, seconds, mistakes, hasNext }
 * handlers: { onNext, onRestart, onScores, onMenu } are called when the buttons are clicked.
 */
export function showComplete(info, handlers) {
  const plural = info.mistakes === 1 ? 'mistake' : 'mistakes';
  overlayTitle.textContent = info.hasNext ? `Level ${info.levelNumber} complete!` : 'You conquered the reef!';
  overlayText.textContent =
    `You reached the treasure in ${formatTime(info.seconds)} with ${info.mistakes} ${plural}.`;
  overlayScore.textContent = 'Saving your score...';
  nextButton.style.display = info.hasNext ? '' : 'none';
  overlayEl.classList.add('visible');
  // EVENT: the buttons of the box
  nextButton.onclick = () => { nextButton.blur(); handlers.onNext(); };
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
