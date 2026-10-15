// ui.js - the text on top of the 3D scene (status, hints, level complete box).
// It only changes the web page; it contains no game rules.
// Written with help from Claude (AI assistant).

const statusEl = document.getElementById('status');
const messageEl = document.getElementById('message');
const overlayEl = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const restartButton = document.getElementById('restart');

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

/** Shows the "Treasure found" box. onRestart is called when the button is clicked. */
export function showComplete(seconds, mistakes, onRestart) {
  const plural = mistakes === 1 ? 'mistake' : 'mistakes';
  overlayText.textContent = `You reached the treasure in ${formatTime(seconds)} with ${mistakes} ${plural}.`;
  overlayEl.classList.add('visible');
  restartButton.onclick = () => { // EVENT: Play again button
    restartButton.blur();
    onRestart();
  };
}

export function hideComplete() {
  overlayEl.classList.remove('visible');
}
