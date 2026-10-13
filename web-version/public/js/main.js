// main.js - starts the game: creates the renderer, scene and camera, then runs the game loop.
// It connects the other modules; the details live in them.
// Written with help from Claude (AI assistant).

import * as THREE from 'three';
import { createWorld } from './world.js';
import { createLevel1, KEEP_CLEAR, START } from './level1.js';
import { Player, PLAYER_RADIUS } from './player.js';
import { resolveCollisions } from './physics.js';
import { consumePress, endFrame } from './input.js';
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

let state = 'playing'; // 'playing' or 'complete'
let elapsed = 0;       // seconds spent in this attempt

function restart() {
  player.reset(START);
  player.snapCamera(camera);
  level.reset();
  elapsed = 0;
  state = 'playing';
  ui.hideComplete();
}

/** Game rules for one frame while the player is swimming. */
function playFrame(dt) {
  elapsed += dt;
  player.update(dt);
  resolveCollisions(player.position, PLAYER_RADIUS, colliders);

  // is the fish at a closed gate?
  const gate = level.gates.find((g) => !g.opened && g.isNear(player.position));
  if (gate) {
    ui.showMessage('Gate locked! Press E to open it (test mode - the fish-counting puzzle comes next).');
    if (consumePress('KeyE')) { // EVENT: E key
      gate.open();
    }
  } else {
    ui.hideMessage();
  }

  // reached the treasure?
  if (level.chest.isNear(player.position)) {
    state = 'complete';
    ui.hideMessage();
    ui.showComplete(elapsed, restart);
  }

  const opened = level.gates.filter((g) => g.opened).length;
  ui.setStatus(opened, level.gates.length, elapsed);
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
