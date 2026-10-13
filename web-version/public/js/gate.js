// gate.js - a checkpoint gate: two glowing posts and a see-through barrier across a gap in a wall.
// While the gate is closed the barrier blocks the fish. open() lets the fish through.
// Written with help from Claude (AI assistant).

import * as THREE from 'three';

export const GAP_HALF = 5.5; // half the width of the gap the gate closes

export class Gate {
  constructor(scene, x, z) {
    this.x = x;
    this.z = z;
    this.opened = false;

    this.postMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd34d, emissive: 0xffa800, emissiveIntensity: 0.9, flatShading: true,
    });
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 26, 6), this.postMaterial);
      post.position.set(x + side * (GAP_HALF + 0.1), 11, z);
      scene.add(post);
    }

    // the glowing barrier you cannot swim through
    this.barrier = new THREE.Mesh(
      new THREE.PlaneGeometry(GAP_HALF * 2 + 1.6, 24),
      new THREE.MeshBasicMaterial({
        color: 0x5ff0ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false,
      }),
    );
    this.barrier.position.set(x, 11, z);
    scene.add(this.barrier);

    // the invisible box the physics uses (see physics.js)
    this.collider = { type: 'box', x, y: 11, z, hx: GAP_HALF + 0.8, hy: 12, hz: 0.6, enabled: true };
  }

  /** Is the fish close enough to interact with this gate? */
  isNear(position, distance = 10) {
    return Math.hypot(position.x - this.x, position.z - this.z) < distance;
  }

  open() {
    this.opened = true;
    this.collider.enabled = false;
    this.barrier.visible = false;
    this.postMaterial.color.set(0x4cff88);   // the posts turn green
    this.postMaterial.emissive.set(0x00c040);
  }

  /** Closes the gate again (used when the level restarts). */
  reset() {
    this.opened = false;
    this.collider.enabled = true;
    this.barrier.visible = true;
    this.postMaterial.color.set(0xffd34d);
    this.postMaterial.emissive.set(0xffa800);
  }

  update(time) {
    if (!this.opened) {
      this.barrier.material.opacity = 0.28 + 0.12 * Math.sin(time * 3); // gentle pulse
    }
  }
}
