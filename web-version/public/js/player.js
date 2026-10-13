// player.js - the player's fish: its 3D model, swimming controls and the chase camera.
.

import * as THREE from 'three';
import { isDown } from './input.js';
import { seabedHeight, WORLD_SIZE, WATER_TOP } from './world.js';

const MAX_SPEED = 12;   // units per second
const TURN_SPEED = 1.8; // radians per second
const LIFT_SPEED = 5;   // units per second
const LIMIT = WORLD_SIZE / 2 - 2; // the fish cannot leave the world

export const PLAYER_RADIUS = 1.1; // size used for collisions

/** Builds a low-poly fish. The nose points along +Z. */
function buildFish() {
  const fish = new THREE.Group();
  const orange = new THREE.MeshStandardMaterial({ color: 0xff8c00, flatShading: true });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
  const black = new THREE.MeshStandardMaterial({ color: 0x111111 });

  // body: a stretched sphere
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), orange);
  body.scale.set(0.7, 0.9, 1.6);
  fish.add(body);

  // tail: a flat cone on a pivot, so it can wag from side to side
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0, -1.5);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 4), orange);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = -0.4;
  tail.scale.x = 0.2;
  tailPivot.add(tail);
  fish.add(tailPivot);

  // fin on top
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 3), orange);
  fin.position.set(0, 0.95, -0.1);
  fin.scale.x = 0.2;
  fish.add(fin);

  // eyes
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), white);
    eye.position.set(side * 0.45, 0.2, 1.0);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), black);
    pupil.position.set(side * 0.58, 0.2, 1.1);
    fish.add(eye, pupil);
  }

  fish.userData.tailPivot = tailPivot;
  fish.scale.setScalar(0.8);
  return fish;
}

export class Player {
  constructor(scene, start) {
    this.group = buildFish();
    this.group.rotation.order = 'YXZ'; // turn first, then tilt up/down, then roll
    scene.add(this.group);
    this.time = 0;
    this.reset(start);
  }

  get position() {
    return this.group.position;
  }

  /** Puts the fish back at the start, facing +Z, not moving. */
  reset(start) {
    this.group.position.set(start.x, start.y, start.z);
    this.yaw = 0;    // direction the fish is facing (radians)
    this.speed = 0;  // forward speed
    this.climb = 0;  // vertical speed
    this.group.rotation.set(0, 0, 0);
  }

  /** Reads the keys and moves the fish. Called once per frame; dt = seconds since last frame. */
  update(dt) {
    this.time += dt;

    const left = isDown('ArrowLeft') || isDown('KeyA');
    const right = isDown('ArrowRight') || isDown('KeyD');
    const forward = isDown('ArrowUp') || isDown('KeyW');
    const back = isDown('ArrowDown') || isDown('KeyS');
    const up = isDown('Space');
    const down = isDown('ShiftLeft') || isDown('ShiftRight');

    const turn = (left ? 1 : 0) - (right ? 1 : 0);
    const thrust = (forward ? 1 : 0) - (back ? 1 : 0);
    const lift = (up ? 1 : 0) - (down ? 1 : 0);

    // smooth speed changes (the fish speeds up and slows down gradually)
    this.yaw += turn * TURN_SPEED * dt;
    const targetSpeed = thrust > 0 ? MAX_SPEED : thrust < 0 ? -MAX_SPEED * 0.4 : 0;
    this.speed += (targetSpeed - this.speed) * Math.min(1, 3 * dt);
    this.climb += (lift * LIFT_SPEED - this.climb) * Math.min(1, 4 * dt);

    const p = this.group.position;
    p.x += Math.sin(this.yaw) * this.speed * dt;
    p.z += Math.cos(this.yaw) * this.speed * dt;
    p.y += this.climb * dt;

    // keep the fish inside the world, above the seabed and below the surface
    p.x = THREE.MathUtils.clamp(p.x, -LIMIT, LIMIT);
    p.z = THREE.MathUtils.clamp(p.z, -LIMIT, LIMIT);
    p.y = THREE.MathUtils.clamp(p.y, seabedHeight(p.x, p.z) + 0.9, WATER_TOP - 1);

    // looks: face the direction, tilt up/down, lean into turns, wag the tail
    this.group.rotation.y = this.yaw;
    this.group.rotation.x = -this.climb * 0.06;
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, -turn * 0.35, Math.min(1, 5 * dt));
    this.group.userData.tailPivot.rotation.y =
      Math.sin(this.time * (5 + Math.abs(this.speed))) * 0.45;
  }

  /** Where the camera wants to be: behind and above the fish. */
  cameraTarget() {
    const behind = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).multiplyScalar(10);
    const wanted = this.group.position.clone().add(behind).add(new THREE.Vector3(0, 3.5, 0));
    wanted.y = Math.max(wanted.y, seabedHeight(wanted.x, wanted.z) + 1);
    return wanted;
  }

  /** Moves the camera smoothly towards its spot, looking at the fish. */
  updateCamera(camera, dt) {
    camera.position.lerp(this.cameraTarget(), 1 - Math.exp(-4 * dt));
    camera.lookAt(this.group.position.x, this.group.position.y + 0.5, this.group.position.z);
  }

  /** Puts the camera straight into place (used after a restart). */
  snapCamera(camera) {
    camera.position.copy(this.cameraTarget());
    camera.lookAt(this.group.position.x, this.group.position.y + 0.5, this.group.position.z);
  }
}
