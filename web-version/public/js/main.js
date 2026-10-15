// main.js - starts the game: creates the renderer, scene and camera, then runs the game loop.
// It connects the other modules; the details live in them.
// Written with help from Claude (AI assistant).

import * as THREE from 'three';
import { createWorld } from './world.js';
import { createLevel1, KEEP_CLEAR, START } from './level1.js';
import { Player, PLAYER_RADIUS } from './player.js';
import { resolveCollisions } from './physics.js';
import { consumePress, endFrame } from './input.js';
import { askPuzzle } from './puzzle.js';
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

let state = 'playing'; // 'playing', 'puzzle' (a gate puzzle is open) or 'complete'
let elapsed = 0;       // seconds spent swimming in this attempt (paused during puzzles)
let mistakes = 0;      // wrong puzzle answers in this attempt

function restart() {
  player.reset(START);
  player.snapCamera(camera);
  level.reset();
  elapsed = 0;
  mistakes = 0;
  state = 'playing';
  ui.hideComplete();
}

/** The player pressed E at a closed gate: show the Fish puzzle and open the gate if it is solved. */
async function solveGate(gate) {
  state = 'puzzle'; // the fish and the timer pause while the puzzle is open
  ui.hideMessage();
  const result = await askPuzzle(); // browser -> our server -> Fish Game API
  mistakes += result.mistakes;
  if (result.solved) {
    gate.open();
  }
  state = 'playing';
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
    state = 'complete';
    ui.hideMessage();
    ui.showComplete(elapsed, mistakes, restart);
  }

  const opened = level.gates.filter((g) => g.opened).length;
  ui.setStatus(opened, level.gates.length, mistakes, elapsed);
}

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
  player.updateCamera(camera, dt);
  renderer.render(scene, camera);
  endFrame();
}
animate();
