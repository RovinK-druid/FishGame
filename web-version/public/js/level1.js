// level1.js - the first level: two rock walls with a gap each. A gate closes each gap.
// Swim through both gates to reach the treasure chest. Sea mines float in all three areas and
// predator fish patrol the two areas behind the walls.
//
//   start (z = -66)  ->  wall 1 + gate 1 (z = -35)  ->  wall 2 + gate 2 (z = 10)  ->  chest (z = 58)

import * as THREE from 'three';
import { seabedHeight, WORLD_SIZE, seededRandom } from './world.js';
import { Gate, GAP_HALF } from './gate.js';
import { Chest } from './chest.js';
import { Mine } from './mine.js';
import { Predator } from './predator.js';

export const START = { x: 0, y: 6, z: -66 };

const WALLS = [
  { z: -35, gapX: -18 },
  { z: 10, gapX: 20 },
];
const CHEST = { x: 0, z: 58 };

// Sea mines: [x, height, z]. They are kept away from the start, the gates and the chest.
const MINES = [
  // area 1: from the start to wall 1
  [-8, 6, -57], [9, 9, -52], [-2, 8, -44], [14, 5, -64],
  // area 2: between the two walls
  [-30, 7, -18], [0, 9, -12], [28, 6, -20], [-10, 12, -4],
  // area 3: from wall 2 to the chest
  [-10, 7, 25], [12, 10, 32], [0, 6, 44], [-20, 9, 52], [30, 8, 24],
];

// Predators: where they start and the area they wander in (they chase anywhere they can reach).
const PREDATORS = [
  { x: 10, y: 10, z: -12, zone: { minX: -72, maxX: 72, minZ: -31, maxZ: 6 } },   // area 2
  { x: -25, y: 12, z: 38, zone: { minX: -72, maxX: 72, minZ: 14, maxZ: 72 } },   // area 3
  { x: 35, y: 9, z: 52, zone: { minX: -72, maxX: 72, minZ: 14, maxZ: 72 } },     // area 3
];

/** Places where the world should keep random rocks away, so the route stays clear. */
export const KEEP_CLEAR = [
  { x: START.x, z: START.z, r: 12 },
  ...WALLS.map((w) => ({ x: w.gapX, z: w.z, r: 16 })),
  { x: CHEST.x, z: CHEST.z, r: 12 },
];

export function createLevel1(scene) {
  const rand = seededRandom(7);
  const colliders = [];
  const gates = [];
  const rocks = [];
  const half = WORLD_SIZE / 2;

  for (const wall of WALLS) {
    // rock columns on both sides of the gap, from the gap out to the edge of the world
    for (const direction of [-1, 1]) {
      for (let x = wall.gapX + direction * (GAP_HALF + 3.6); Math.abs(x) <= half + 6; x += direction * 4.5) {
        // stack rocks up to the water surface so the fish cannot swim over the wall
        for (let y = 1; y <= 22; y += 4.2) {
          rocks.push({
            x: x + (rand() - 0.5) * 0.8,
            y: y + (rand() - 0.5),
            z: wall.z + (rand() - 0.5) * 1.2,
            r: 3.2 + rand() * 0.8,
          });
        }
      }
    }
    gates.push(new Gate(scene, wall.gapX, wall.z));
  }

  // draw all wall rocks with ONE InstancedMesh (much faster than hundreds of separate meshes)
  const material = new THREE.MeshStandardMaterial({ color: 0x5b6070, flatShading: true, roughness: 1 });
  const wallMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), material, rocks.length);
  const dummy = new THREE.Object3D();
  rocks.forEach((rock, i) => {
    dummy.position.set(rock.x, rock.y, rock.z);
    dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    dummy.scale.setScalar(rock.r);
    dummy.updateMatrix();
    wallMesh.setMatrixAt(i, dummy.matrix);
    colliders.push({ type: 'sphere', x: rock.x, y: rock.y, z: rock.z, r: rock.r * 0.9 });
  });
  scene.add(wallMesh);

  // gates are obstacles while closed
  for (const gate of gates) {
    colliders.push(gate.collider);
  }

  const chest = new Chest(scene, CHEST.x, seabedHeight(CHEST.x, CHEST.z) + 0.2, CHEST.z);
  const mines = MINES.map(([x, y, z]) => new Mine(scene, x, y, z));
  const predators = PREDATORS.map((spawn, i) => new Predator(scene, spawn, i + 1));

  return {
    gates,
    chest,
    mines,
    predators,
    colliders,
    /** time = seconds since the game loaded, dt = seconds since the last frame */
    update(time, dt) {
      gates.forEach((gate) => gate.update(time));
      chest.update(time);
      mines.forEach((mine) => mine.update(time, dt));
    },
    /** Closes every gate and puts every mine and predator back. */
    reset() {
      gates.forEach((gate) => gate.reset());
      mines.forEach((mine) => mine.reset());
      predators.forEach((predator) => predator.reset());
    },
  };
}
