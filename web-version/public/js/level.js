// level.js - builds one level from its data (see levels.js): rock walls, gates, the treasure chest,
// sea mines and predator fish. Everything of a level lives in one group, so the level can be
// shown or hidden as a whole.


import * as THREE from 'three';
import { seabedHeight, WORLD_SIZE, seededRandom } from './world.js';
import { Gate, GAP_HALF } from './gate.js';
import { Chest } from './chest.js';
import { Mine } from './mine.js';
import { Predator } from './predator.js';

export function createLevel(scene, def) {
  const group = new THREE.Group();
  scene.add(group);

  const rand = seededRandom(def.seed);
  const colliders = [];
  const gates = [];
  const rocks = [];
  const half = WORLD_SIZE / 2;

  for (const wall of def.walls) {
    const gap = wall.gap ?? GAP_HALF;
    // rock columns on both sides of the gap, from the gap out to the edge of the world
    for (const direction of [-1, 1]) {
      for (let x = wall.gapX + direction * (gap + 3.6); Math.abs(x) <= half + 6; x += direction * 4.5) {
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
    gates.push(new Gate(group, wall.gapX, wall.z, gap));
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
  group.add(wallMesh);

  // gates are obstacles while closed
  for (const gate of gates) {
    colliders.push(gate.collider);
  }

  const chest = new Chest(group, def.chest.x, seabedHeight(def.chest.x, def.chest.z) + 0.2, def.chest.z);
  const mines = def.mines.map(([x, y, z]) => new Mine(group, x, y, z));
  const predators = def.predators.map((spawn, i) => new Predator(group, spawn, def.seed * 10 + i));

  return {
    def,
    group,
    gates,
    chest,
    mines,
    predators,
    colliders,
    /** Shows or hides the whole level. */
    setActive(active) {
      group.visible = active;
    },
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
