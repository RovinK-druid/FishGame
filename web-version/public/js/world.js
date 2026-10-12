// world.js - builds the underwater world: lights, seabed, rocks, seaweed, bubbles, surface.
// It only creates and animates scenery. It knows nothing about the player or the keyboard.


import * as THREE from 'three';

export const WORLD_SIZE = 160; // the playable area is WORLD_SIZE x WORLD_SIZE
export const WATER_TOP = 22;   // height of the water surface

/** Height of the seabed at (x, z). Other modules use this to stay above the floor. */
export function seabedHeight(x, z) {
  return Math.sin(x * 0.12) * Math.cos(z * 0.1) * 1.2 + Math.sin(x * 0.31 + z * 0.27) * 0.4;
}

// A small random number generator with a fixed seed, so the reef looks the same every time.
function seededRandom(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xbfe9ff, 0x1a3a5a, 1.1)); // soft light from above and below
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);         // sunlight through the water
  sun.position.set(30, 60, 20);
  scene.add(sun);
}

function addSeabed(scene) {
  const geometry = new THREE.PlaneGeometry(WORLD_SIZE * 1.6, WORLD_SIZE * 1.6, 70, 70);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, seabedHeight(pos.getX(i), pos.getZ(i)));
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: 0xd9c48b, flatShading: true, roughness: 1 });
  scene.add(new THREE.Mesh(geometry, material));
}

function addSurface(scene) {
  const geometry = new THREE.PlaneGeometry(WORLD_SIZE * 3, WORLD_SIZE * 3);
  geometry.rotateX(Math.PI / 2); // faces downwards, so you see it from below
  const material = new THREE.MeshBasicMaterial({
    color: 0x7fd4ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
  });
  const surface = new THREE.Mesh(geometry, material);
  surface.position.y = WATER_TOP;
  scene.add(surface);
}

function addRocks(scene, rand) {
  const material = new THREE.MeshStandardMaterial({ color: 0x6f7480, flatShading: true, roughness: 1 });
  for (let i = 0; i < 45; i++) {
    const radius = 1 + rand() * 3;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 0), material);
    const x = (rand() - 0.5) * WORLD_SIZE;
    const z = (rand() - 0.5) * WORLD_SIZE;
    rock.position.set(x, seabedHeight(x, z) + radius * 0.4, z);
    rock.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    rock.scale.y = 0.6 + rand() * 0.5;
    scene.add(rock);
  }
}

function addSeaweed(scene, rand) {
  const material = new THREE.MeshStandardMaterial({ color: 0x2e9e5b, flatShading: true });
  const weeds = [];
  for (let i = 0; i < 80; i++) {
    const height = 2 + rand() * 4;
    const geometry = new THREE.CylinderGeometry(0.04, 0.18, height, 5);
    geometry.translate(0, height / 2, 0); // so the bottom of the plant is at the seabed
    const weed = new THREE.Mesh(geometry, material);
    const x = (rand() - 0.5) * WORLD_SIZE;
    const z = (rand() - 0.5) * WORLD_SIZE;
    weed.position.set(x, seabedHeight(x, z), z);
    weed.userData.phase = rand() * Math.PI * 2;
    weeds.push(weed);
    scene.add(weed);
  }
  return weeds;
}

function addBubbles(scene, rand) {
  const count = 160;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * WORLD_SIZE;
    positions[i * 3 + 1] = rand() * WATER_TOP;
    positions[i * 3 + 2] = (rand() - 0.5) * WORLD_SIZE;
    speeds[i] = 0.8 + rand() * 1.6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.7 });
  scene.add(new THREE.Points(geometry, material));
  return { geometry, positions, speeds, count };
}

/**
 * Builds the whole world and returns an object with update(time, dt),
 * which the game loop calls every frame to animate the seaweed and bubbles.
 */
export function createWorld(scene) {
  const rand = seededRandom(42);
  addLights(scene);
  addSeabed(scene);
  addSurface(scene);
  addRocks(scene, rand);
  const weeds = addSeaweed(scene, rand);
  const bubbles = addBubbles(scene, rand);

  return {
    update(time, dt) {
      // seaweed sways
      for (const weed of weeds) {
        weed.rotation.z = Math.sin(time * 1.2 + weed.userData.phase) * 0.18;
        weed.rotation.x = Math.cos(time * 0.9 + weed.userData.phase) * 0.1;
      }
      // bubbles rise, then start again at the bottom
      for (let i = 0; i < bubbles.count; i++) {
        bubbles.positions[i * 3 + 1] += bubbles.speeds[i] * dt;
        if (bubbles.positions[i * 3 + 1] > WATER_TOP) {
          bubbles.positions[i * 3 + 1] = 0.5;
        }
      }
      bubbles.geometry.attributes.position.needsUpdate = true;
    },
  };
}
