// main.js - starts the game: creates the renderer, scene and camera, then runs the game loop.
// It connects the other modules; the details live in them.
//
// The 3D reef is drawn all the time. The state decides what happens:
//   'menu'     a menu screen is on top and the camera slowly circles the start
//   'playing'  the player swims (mines and predators are active)
//   'puzzle'   a gate puzzle window is open (everything pauses)
//   'complete' the treasure was reached
//   'dead'     all lives were lost


import * as THREE from 'three';
import { createWorld } from './world.js';
import { createLevel1, KEEP_CLEAR, START } from './level1.js';
import { Player, PLAYER_RADIUS } from './player.js';
import { resolveCollisions } from './physics.js';
import { updateHazards } from './hazards.js';
import { consumePress, endFrame } from './input.js';
import { askPuzzle, closePuzzle } from './puzzle.js';
import { submitScore, setUnauthorizedHandler } from './api.js';
import { initScreens, showScreen, showStart, openScores } from './screens.js';
import * as ui from './ui.js';

const WATER_COLOUR = 0x1a6fa8;
const START_LIVES = 3;
const PROTECTION_SECONDS = 2; // after being hurt the fish cannot be hurt again for a moment

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
let elapsed = 0;     // seconds spent swimming in this attempt (paused during puzzles)
let mistakes = 0;    // wrong puzzle answers in this attempt
let lives = START_LIVES;
let protection = 0;  // seconds of protection left after being hurt

/** Back to the idle state behind the menu screens. */
function resetToMenuState() {
  state = 'menu';
  ui.hideMessage();
  ui.hideComplete();
  ui.hideDead();
  level.reset();
  player.reset(START);
  player.group.visible = true;
}

/** Starts (or restarts) the level. */
function restart() {
  player.reset(START);
  player.group.visible = true;
  player.snapCamera(camera);
  level.reset();
  elapsed = 0;
  mistakes = 0;
  lives = START_LIVES;
  protection = 0;
  state = 'playing';
  ui.hideComplete();
  ui.hideDead();
}

function startGame() {
  restart();
  showScreen(null); // hide the menu screens, show only the game
}

/** The player pressed E at a closed gate: show the Fish puzzle and open the gate if it is solved. */
async function solveGate(gate) {
  state = 'puzzle'; // everything pauses while the puzzle is open
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

/** A mine or a predator hurt the player. */
function hurtPlayer(hit) {
  lives -= 1;
  protection = PROTECTION_SECONDS;
  ui.flashDamage();
  player.knockback(hit.from.x, hit.from.y, hit.from.z, hit.kind === 'mine' ? 4 : 5);
  resolveCollisions(player.position, PLAYER_RADIUS, colliders);
  if (lives <= 0) {
    state = 'dead';
    player.group.visible = true;
    ui.hideMessage();
    ui.showDead(hit.kind === 'mine' ? 'You hit a mine!' : 'A predator caught you!', {
      onRetry: restart,
      onMenu: () => { resetToMenuState(); showScreen('menu'); },
    });
  }
}

/** Game rules for one frame while the player is swimming. */
function playFrame(dt) {
  elapsed += dt;
  player.update(dt);
  resolveCollisions(player.position, PLAYER_RADIUS, colliders);

  // mines and predators
  protection = Math.max(0, protection - dt);
  const hit = updateHazards(level, player.position, PLAYER_RADIUS, dt, colliders, protection <= 0);
  if (hit) {
    hurtPlayer(hit);
  }
  // the fish blinks while it is protected
  player.group.visible = protection <= 0 || Math.floor(protection * 10) % 2 === 0;

  const opened = level.gates.filter((g) => g.opened).length;
  ui.setStatus(lives, opened, level.gates.length, mistakes, elapsed);
  if (state !== 'playing') {
    return; // the player was just defeated
  }

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
  level.update(clock.elapsedTime, dt);
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
