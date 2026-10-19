// main.js - starts the game: creates the renderer, scene and camera, then runs the game loop.
// It connects the other modules; the details live in them.
//
// The 3D reef is drawn all the time. The state decides what happens:
//   'menu'     a menu screen is on top and the camera slowly circles the start
//   'playing'  the player swims
//   'puzzle'   a gate puzzle window is open (the fish and the timer pause)
//   'complete' the treasure was reached


import * as THREE from 'three';
import { createWorld } from './world.js';
import { createLevel1, KEEP_CLEAR, START } from './level1.js';
import { Player, PLAYER_RADIUS } from './player.js';
import { resolveCollisions } from './physics.js';
import { consumePress, endFrame } from './input.js';
import { askPuzzle, closePuzzle } from './puzzle.js';
import { submitScore, setUnauthorizedHandler } from './api.js';
import { initScreens, showScreen, showStart, openScores } from './screens.js';
import * as ui from './ui.js';

const WATER_COLOUR = 0x1a6fa8;

// the renderer draws the 3D scene onto the canvas
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// the scene holds everything; fog makes distant things fade into the water colour
const scene = new THREE.Scene();
scene.background = new THREE.Color(WATER_COLOUR);
scene.fog = new THREE.FogExp2(WATER_COLOUR, 0.025);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);

const world = createWorld(scene, KEEP_CLEAR);
const level = createLevel1(scene);
const player = new Player(scene, START);
player.snapCamera(camera);

// everything the fish can bump into
const colliders = [...world.colliders, ...level.colliders];

// EVENT: keep the picture correct when the browser window changes size
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let state = 'menu';
let elapsed = 0;   // seconds spent swimming in this attempt (paused during puzzles)
let mistakes = 0;  // wrong puzzle answers in this attempt

/** Back to the idle state behind the menu screens. */
function resetToMenuState() {
  state = 'menu';
  ui.hideMessage();
  ui.hideComplete();
  player.reset(START);
}

/** Starts (or restarts) the level. */
function restart() {
  player.reset(START);
  player.snapCamera(camera);
  level.reset();
  elapsed = 0;
  mistakes = 0;
  state = 'playing';
  ui.hideComplete();
}

function startGame() {
  restart();
  showScreen(null); // hide the menu screens, show only the game
}

/** The player pressed E at a closed gate: show the Fish puzzle and open the gate if it is solved. */
async function solveGate(gate) {
  state = 'puzzle'; // the fish and the timer pause while the puzzle is open
  ui.hideMessage();
  const result = await askPuzzle(); // browser -> our server -> Fish Game API
  if (state !== 'puzzle') {
    return; // the session ended while the puzzle was open
  }
  mistakes += result.mistakes;
  if (result.solved) {
    gate.open();
  }
  state = 'playing';
}

/** The treasure was reached: show the result box and save the score on the server. */
function finishLevel() {
  state = 'complete';
  ui.hideMessage();
  ui.showComplete(elapsed, mistakes, {
    onRestart: restart,
    onScores: () => { resetToMenuState(); openScores(); },
    onMenu: () => { resetToMenuState(); showScreen('menu'); },
  });
  submitScore(Math.round(elapsed), mistakes)
    .then((result) => {
      const best = result.personalBest ? '  -  New personal best!' : '';
      ui.setScoreResult(`Score: ${result.score}${best}  (rank ${result.rank})`);
    })
    .catch((error) => ui.setScoreResult(`Score not saved: ${error.message}`));
}

/** Game rules for one frame while the player is swimming. */
function playFrame(dt) {
  elapsed += dt;
  player.update(dt);
  resolveCollisions(player.position, PLAYER_RADIUS, colliders);

  // is the fish at a closed gate?
  const gate = level.gates.find((g) => !g.opened && g.isNear(player.position));
  if (gate) {
    ui.showMessage('Gate locked! Press E and count the fish to open it.');
    if (consumePress('KeyE')) { // EVENT: E key
      solveGate(gate);
    }
  } else {
    ui.hideMessage();
  }

  // reached the treasure?
  if (state === 'playing' && level.chest.isNear(player.position)) {
    finishLevel();
  }

  const opened = level.gates.filter((g) => g.opened).length;
  ui.setStatus(opened, level.gates.length, mistakes, elapsed);
}

/** Behind the menus the camera slowly circles the fish. */
function menuCamera(time) {
  const radius = 16;
  camera.position.set(
    START.x + Math.cos(time * 0.15) * radius,
    START.y + 3,
    START.z + Math.sin(time * 0.15) * radius,
  );
  camera.lookAt(START.x, START.y, START.z);
}

// If the server says the session has ended, go back to the login screen.
setUnauthorizedHandler(() => {
  closePuzzle();
  resetToMenuState();
  showScreen('login');
});

initScreens({ onPlay: startGame, onLogout: resetToMenuState });
showStart(); // login screen or menu, depending on the cookie

// The game loop: runs about 60 times a second
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05); // seconds since the last frame (capped)

  world.update(clock.elapsedTime, dt);
  level.update(clock.elapsedTime);
  if (state === 'playing') {
    playFrame(dt);
  }
  if (state === 'menu') {
    menuCamera(clock.elapsedTime);
  } else {
    player.updateCamera(camera, dt);
  }
  renderer.render(scene, camera);
  endFrame();
}
animate();
