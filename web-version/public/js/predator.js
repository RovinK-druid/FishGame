// predator.js - a big predator fish. It patrols its area slowly. When the player comes close it
// chases, a bit slower than the player's top speed, so the player can escape by swimming away
// (and rock walls and closed gates stop it, just like the player).
// After it catches the player it backs off for a few seconds.


import * as THREE from 'three';
import { seabedHeight, WORLD_SIZE, WATER_TOP, seededRandom } from './world.js';
import { resolveCollisions } from './physics.js';

const RADIUS = 1.8;        // size used for collisions and for catching the player
const PATROL_SPEED = 4;    // units per second while wandering
const CHASE_SPEED = 9;     // default; the player's top speed is 12 (a level can set its own speed)
const DETECT_RANGE = 32;   // default: starts chasing when the player is this close
const LOSE_GAP = 16;       // it gives up when the player is this much further away than that
const CLIMB_SPEED = 3;
const LIMIT = WORLD_SIZE / 2 - 3;

function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Builds a low-poly predator. The nose points along +Z. */
function buildPredator() {
  const fish = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0x7b2d3a, flatShading: true });
  const belly = new THREE.MeshStandardMaterial({ color: 0xe3cfc6, flatShading: true });
  const teeth = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xaa0000 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), skin);
  body.scale.set(1.0, 1.1, 2.8);
  fish.add(body);

  const underside = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), belly);
  underside.scale.set(0.85, 0.6, 2.6);
  underside.position.set(0, -0.5, 0.1);
  fish.add(underside);

  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.7, 3), skin);
  fin.position.set(0, 1.5, -0.4);
  fin.scale.x = 0.15;
  fish.add(fin);

  // tail on a pivot so it can swing from side to side
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0, -2.7);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.0, 4), skin);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = -0.7;
  tail.scale.x = 0.2;
  tailPivot.add(tail);
  fish.add(tailPivot);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), eyeMaterial);
    eye.position.set(side * 0.75, 0.45, 2.0);
    fish.add(eye);
  }

  // a row of teeth under the nose
  for (let i = -3; i <= 3; i++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 4), teeth);
    tooth.rotation.x = Math.PI; // point down
    tooth.position.set(i * 0.2, -0.55, 2.55);
    fish.add(tooth);
  }

  fish.userData.tailPivot = tailPivot;
  fish.scale.setScalar(1.0);
  return fish;
}

export class Predator {
  /**
   * @param spawn { x, y, z, zone: { minX, maxX, minZ, maxZ }, chaseSpeed?, detectRange? }
   *              where it starts and wanders, and (optional) how fast and how far it notices
   * @param seed  makes each predator wander differently (but the same way every game)
   */
  constructor(scene, spawn, seed) {
    this.spawn = spawn;
    this.zone = spawn.zone;
    this.chaseSpeed = spawn.chaseSpeed ?? CHASE_SPEED;
    this.detectRange = spawn.detectRange ?? DETECT_RANGE;
    this.rand = seededRandom(1000 + seed);
    this.group = buildPredator();
    this.group.rotation.order = 'YXZ';
    scene.add(this.group);
    this.time = 0;
    this.reset();
  }

  get position() {
    return this.group.position;
  }

  reset() {
    this.group.position.set(this.spawn.x, this.spawn.y, this.spawn.z);
    this.yaw = this.rand() * Math.PI * 2;
    this.state = 'patrol'; // 'patrol' or 'chase'
    this.cooldown = 0;     // seconds it keeps away after catching the player
    this.target = null;    // where it is swimming to while patrolling
  }

  /** Picks a new random place to swim to inside its own area. */
  pickTarget() {
    const z = this.zone;
    this.target = new THREE.Vector3(
      z.minX + this.rand() * (z.maxX - z.minX),
      3 + this.rand() * 13,
      z.minZ + this.rand() * (z.maxZ - z.minZ),
    );
  }

  /** Did it catch the player (a sphere at `playerPos` with radius `r`)? */
  touches(playerPos, r) {
    if (this.cooldown > 0) {
      return false; // it is backing off after a bite and cannot bite again yet
    }
    return this.group.position.distanceTo(playerPos) < RADIUS + r;
  }

  /** After a bite: swim away from the player and leave them alone for 3 seconds. */
  retreat(playerPos) {
    const p = this.group.position;
    this.cooldown = 3;
    this.state = 'patrol';
    const away = p.clone().sub(playerPos);
    away.y = 0;
    if (away.lengthSq() < 1e-6) {
      away.set(1, 0, 0);
    }
    away.normalize().multiplyScalar(25);
    const target = p.clone().add(away);
    target.x = THREE.MathUtils.clamp(target.x, this.zone.minX, this.zone.maxX);
    target.z = THREE.MathUtils.clamp(target.z, this.zone.minZ, this.zone.maxZ);
    target.y = THREE.MathUtils.clamp(target.y, 3, 16);
    this.target = target;
  }

  /** Moves the predator. dt = seconds; colliders = rocks and closed gates (see physics.js). */
  update(dt, playerPos, colliders) {
    this.time += dt;
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
    const p = this.group.position;
    const distance = p.distanceTo(playerPos);

    // decide: patrol or chase (it gives up at a longer distance than it notices at)
    if (this.state === 'patrol' && this.cooldown <= 0 && distance < this.detectRange) {
      this.state = 'chase';
    } else if (this.state === 'chase' && (distance > this.detectRange + LOSE_GAP || this.cooldown > 0)) {
      this.state = 'patrol';
    }

    // where to, and how fast
    let tx, ty, tz, speed, turnRate;
    if (this.state === 'chase') {
      tx = playerPos.x; ty = playerPos.y; tz = playerPos.z;
      speed = this.chaseSpeed;
      turnRate = 1.7;
    } else {
      if (!this.target || p.distanceTo(this.target) < 3) {
        this.pickTarget();
      }
      tx = this.target.x; ty = this.target.y; tz = this.target.z;
      speed = PATROL_SPEED;
      turnRate = 1.0;
    }

    // turn towards the target, but only so fast: it cannot spin on the spot
    const difference = wrapAngle(Math.atan2(tx - p.x, tz - p.z) - this.yaw);
    this.yaw += THREE.MathUtils.clamp(difference, -turnRate * dt, turnRate * dt);

    // it swims slowly while the target is to its side or behind it
    const facing = Math.max(0.2, Math.cos(Math.min(Math.abs(difference), Math.PI / 2)));
    p.x += Math.sin(this.yaw) * speed * facing * dt;
    p.z += Math.cos(this.yaw) * speed * facing * dt;
    p.y += THREE.MathUtils.clamp(ty - p.y, -CLIMB_SPEED * dt, CLIMB_SPEED * dt);

    // stay inside the world, above the seabed and below the surface
    p.x = THREE.MathUtils.clamp(p.x, -LIMIT, LIMIT);
    p.z = THREE.MathUtils.clamp(p.z, -LIMIT, LIMIT);
    p.y = THREE.MathUtils.clamp(p.y, seabedHeight(p.x, p.z) + RADIUS, WATER_TOP - RADIUS - 1);

    // rock walls and closed gates stop it, like the player
    resolveCollisions(p, RADIUS, colliders);

    // looks: face the way it swims, tilt up or down, swing the tail
    this.group.rotation.y = this.yaw;
    this.group.rotation.x = -THREE.MathUtils.clamp((ty - p.y) * 0.05, -0.3, 0.3);
    this.group.userData.tailPivot.rotation.y = Math.sin(this.time * (4 + speed)) * 0.5;
  }
}
