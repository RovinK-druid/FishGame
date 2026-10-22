// mine.js - a floating sea mine: a dark spiked ball on a chain with a blinking red light.
// Touching it makes it explode (the player loses a life). It is not a solid obstacle: the fish
// can swim through it, which is exactly the danger.


import * as THREE from 'three';
import { seabedHeight } from './world.js';

const HIT_RADIUS = 1.6; // how close counts as touching
const UP = new THREE.Vector3(0, 1, 0);

// the geometry and materials are shared by all mines (saves memory)
let shared = null;
function sharedParts() {
  if (!shared) {
    shared = {
      body: new THREE.SphereGeometry(1.2, 12, 8),
      spike: new THREE.ConeGeometry(0.22, 0.7, 5),
      light: new THREE.SphereGeometry(0.28, 8, 6),
      blast: new THREE.SphereGeometry(1, 16, 12),
      metal: new THREE.MeshStandardMaterial({ color: 0x2e3238, flatShading: true, roughness: 0.6 }),
      chain: new THREE.MeshStandardMaterial({ color: 0x4a4f57, flatShading: true }),
    };
  }
  return shared;
}

// 14 directions for the spikes: along the axes and towards the corners of a cube
const SPIKE_DIRECTIONS = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  ...[-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z]))),
].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());

export class Mine {
  constructor(scene, x, y, z) {
    const parts = sharedParts();
    this.baseY = y;
    this.position = new THREE.Vector3(x, y, z); // used for touching and knock-back
    this.exploded = false;
    this.age = 0; // seconds since it exploded
    this.phase = (x * 0.7 + z * 0.3) % (Math.PI * 2);

    // the ball with its spikes
    this.group = new THREE.Group();
    this.group.add(new THREE.Mesh(parts.body, parts.metal));
    for (const dir of SPIKE_DIRECTIONS) {
      const spike = new THREE.Mesh(parts.spike, parts.metal);
      spike.position.copy(dir).multiplyScalar(1.3);
      spike.quaternion.setFromUnitVectors(UP, dir);
      this.group.add(spike);
    }
    // the blinking warning light (each mine has its own material so they blink separately)
    this.lightMaterial = new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff0000, emissiveIntensity: 1 });
    const light = new THREE.Mesh(parts.light, this.lightMaterial);
    light.position.set(0, 1.55, 0);
    this.group.add(light);
    this.group.position.copy(this.position);
    scene.add(this.group);

    // the chain down to the seabed
    const floor = seabedHeight(x, z);
    const length = Math.max(0.5, y - 1.2 - floor);
    this.chain = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, length, 5), parts.chain);
    this.chain.position.set(x, floor + length / 2, z);
    scene.add(this.chain);

    // the flash of the explosion
    this.blast = new THREE.Mesh(parts.blast, new THREE.MeshBasicMaterial({
      color: 0xffa030, transparent: true, opacity: 0.7, depthWrite: false,
    }));
    this.blast.position.copy(this.position);
    this.blast.visible = false;
    scene.add(this.blast);
  }

  /** Is the fish (a sphere at `playerPos` with radius `r`) touching this mine? */
  touches(playerPos, r) {
    return !this.exploded && this.position.distanceTo(playerPos) < HIT_RADIUS + r;
  }

  explode() {
    this.exploded = true;
    this.age = 0;
    this.group.visible = false;
    this.chain.visible = false;
    this.blast.visible = true;
  }

  reset() {
    this.exploded = false;
    this.group.visible = true;
    this.chain.visible = true;
    this.blast.visible = false;
  }

  /** time = seconds since the game loaded, dt = seconds since the last frame. */
  update(time, dt) {
    if (!this.exploded) {
      this.group.position.y = this.baseY + Math.sin(time * 1.5 + this.phase) * 0.3; // gentle bobbing
      const on = Math.sin(time * 4 + this.phase) > 0; // blinking light
      this.lightMaterial.emissiveIntensity = on ? 1.2 : 0.15;
    } else if (this.blast.visible) {
      this.age += dt;
      this.blast.scale.setScalar(1 + this.age * 12);
      this.blast.material.opacity = Math.max(0, 0.7 - this.age * 1.4);
      if (this.age > 0.5) {
        this.blast.visible = false;
      }
    }
  }
}
