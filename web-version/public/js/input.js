// input.js - keyboard input
// The browser sends keydown / keyup EVENTS. This module listens for them and remembers which
// keys are held down, so the game loop can ask "is this key down right now?" on every frame.
// Written with help from Claude (AI assistant).

const held = new Set();

// Keys the game uses; stop the browser from scrolling the page when they are pressed.
const GAME_KEYS = [
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight',
];

window.addEventListener('keydown', (event) => {
  if (GAME_KEYS.includes(event.code)) {
    event.preventDefault();
  }
  held.add(event.code);
});

window.addEventListener('keyup', (event) => {
  held.delete(event.code);
});

// If the window loses focus, forget all keys (otherwise a key could seem "stuck").
window.addEventListener('blur', () => held.clear());

export function isDown(code) {
  return held.has(code);
}
