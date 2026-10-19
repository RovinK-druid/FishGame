// ui.js - the text on top of the 3D scene while playing (status, hints, level complete box).
// It only changes the web page; it contains no game rules.


const statusEl = document.getElementById('status');
const messageEl = document.getElementById('message');
const overlayEl = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const overlayScore = document.getElementById('overlay-score');
const restartButton = document.getElementById('restart');
const scoresButton = document.getElementById('complete-scores');
const menuButton = document.getElementById('complete-menu');

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function setStatus(gatesOpened, gatesTotal, mistakes, seconds) {
  statusEl.textContent =
    `Gates ${gatesOpened}/${gatesTotal}   |   Mistakes ${mistakes}   |   Time ${formatTime(seconds)}`;
}

export function showMessage(text) {
  messageEl.textContent = text;
  messageEl.classList.add('visible');
}

export function hideMessage() {
  messageEl.classList.remove('visible');
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
