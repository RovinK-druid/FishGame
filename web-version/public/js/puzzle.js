// puzzle.js - the checkpoint puzzle window: a fish picture and the buttons 0-9.
// askPuzzle() opens it and returns a Promise that finishes with { solved, mistakes }.


import { requestPuzzle, submitAnswer } from './api.js';

const overlay = document.getElementById('puzzle');
const image = document.getElementById('puzzle-image');
const feedback = document.getElementById('puzzle-feedback');
const buttonsBox = document.getElementById('puzzle-buttons');
const cancelButton = document.getElementById('puzzle-cancel');

// the ten answer buttons are created once
const buttons = [];
for (let i = 0; i < 10; i++) {
  const button = document.createElement('button');
  button.textContent = String(i);
  button.addEventListener('click', () => answer(i)); // EVENT: an answer button was clicked
  buttonsBox.appendChild(button);
  buttons.push(button);
}
cancelButton.addEventListener('click', () => finish(false)); // EVENT: Cancel button

// EVENT: the picture could not be displayed - do not let the player answer a puzzle they cannot see
image.addEventListener('error', () => {
  if (current && current.id) {
    setButtonsEnabled(false);
    showFeedback('The picture could not be shown. Press Esc and try the gate again.', 'bad');
  }
});

let current = null; // the puzzle being shown: { id, mistakes, busy, resolve }

function showFeedback(text, kind) {
  feedback.textContent = text;
  feedback.className = kind || '';
}

function setButtonsEnabled(enabled) {
  buttons.forEach((b) => { b.disabled = !enabled; });
}

/** EVENT: keyboard while the puzzle is open - digits answer, Escape closes. */
function onKey(event) {
  if (event.code === 'Escape') {
    finish(false);
    return;
  }
  const match = /^(?:Digit|Numpad)(\d)$/.exec(event.code);
  if (match) {
    answer(Number(match[1]));
  }
}

function finish(solved) {
  const round = current;
  current = null; // a late reply from the server will now be ignored
  overlay.classList.remove('visible');
  window.removeEventListener('keydown', onKey);
  if (round) {
    round.resolve({ solved, mistakes: round.mistakes });
  }
}

async function answer(guess) {
  const round = current;
  if (!round || !round.id || round.busy) {
    return; // nothing loaded yet, or still waiting for the last answer
  }
  round.busy = true;
  setButtonsEnabled(false);
  try {
    const result = await submitAnswer(round.id, guess); // browser -> our server
    if (current !== round) {
      return;
    }
    if (result.correct) {
      finish(true);
    } else {
      round.mistakes += 1;
      showFeedback('Not quite - try again!', 'bad');
      round.busy = false;
      setButtonsEnabled(true);
    }
  } catch (error) {
    if (current !== round) {
      return;
    }
    showFeedback(`${error.message} Press Esc to close.`, 'bad');
    // buttons stay disabled: the puzzle cannot be answered any more
  }
}

/** Opens the puzzle. Resolves to { solved: boolean, mistakes: number } when it is closed. */
export function askPuzzle() {
  return new Promise((resolve) => {
    const round = { id: null, mistakes: 0, busy: false, resolve };
    current = round;

    image.removeAttribute('src');
    image.style.visibility = 'hidden';
    setButtonsEnabled(false);
    showFeedback('Loading a puzzle from the Fish server...', '');
    overlay.classList.add('visible');
    window.addEventListener('keydown', onKey);

    requestPuzzle()
      .then((puzzle) => {
        if (current !== round) {
          return; // the player closed the window while it was loading
        }
        round.id = puzzle.id;
        image.src = puzzle.image;
        image.style.visibility = 'visible';
        showFeedback('Count only the FISH (not the treasure), then pick a number.', '');
        setButtonsEnabled(true);
      })
      .catch((error) => {
        if (current !== round) {
          return;
        }
        showFeedback(`${error.message} Press Esc to close.`, 'bad');
      });
  });
}

/** Closes the puzzle window without an answer (used when the session ends). */
export function closePuzzle() {
  finish(false);
}
