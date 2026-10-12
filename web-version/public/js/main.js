// main.js - starts the game: creates the renderer, scene and camera, then runs the game loop.
// Written with help from Claude (AI assistant).

import * as THREE from 'three';
import { createWorld } from './world.js';
import { Player } from './player.js';

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
camera.position.set(0, 9, -10);

const world = createWorld(scene);
const player = new Player(scene);

// EVENT: keep the picture correct when the browser window changes size
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// The game loop: runs about 60 times a second
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05); // seconds since the last frame (capped)
  world.update(clock.elapsedTime, dt);
  player.update(dt);
  player.updateCamera(camera, dt);
  renderer.render(scene, camera);
}
animate();
