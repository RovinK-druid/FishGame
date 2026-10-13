// input.js - keyboard input
// The browser sends keydown / keyup EVENTS. This module listens for them and remembers
//  - which keys are held down (isDown), and
//  - which keys were just pressed this frame (consumePress), e.g. for "press E to open".
// The game loop asks about the keys on every frame.
// Written with help from Claude (AI assistant).

const held = new Set();
const justPressed = new Set();

// Keys the game uses; stop the browser from scrolling the page when they are pressed.
const GAME_KEYS = [
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'Space', 'ShiftLeft', 'ShiftRight',
];

window.addEventListener('keydown', (event) => {
  if (GAME_KEYS.includes(event.code)) {
    event.preventDefault();
  }
  if (!held.has(event.code)) {
    justPressed.add(event.code); // first moment the key goes down
  }
  held.add(event.code);
});

window.addEventListener('keyup', (event) => {
  held.delete(event.code);
});

// If the window loses focus, forget all keys (otherwise a key could seem "stuck").
window.addEventListener('blur', () => held.clear());

/** True while the key is held down. */
export function isDown(code) {
  return held.has(code);
}

/** True once for each key press (and then false until the key is pressed again). */
export function consumePress(code) {
  return justPressed.delete(code);
}

/** Called at the end of every frame so old key presses do not pile up. */
export function endFrame() {
  justPressed.clear();
}
