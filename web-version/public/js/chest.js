// chest.js - the treasure chest at the end of the level, with a spinning gem above it.
// Written with help from Claude (AI assistant).

import * as THREE from 'three';

export class Chest {
  constructor(scene, x, y, z) {
    this.x = x;
    this.z = z;
    this.baseY = y;

    const wood = new THREE.MeshStandardMaterial({ color: 0xb5773a, flatShading: true });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x8a5524, flatShading: true });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xffd34d, emissive: 0xffa800, emissiveIntensity: 0.8, flatShading: true,
    });

    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.8, 2.2), wood);
    body.position.y = 0.9;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.8, 2.4), darkWood);
    lid.position.y = 2.2;
    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), gold);
    clasp.position.set(0, 1.9, 1.25);
    const band1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.9, 2.5), gold);
    band1.position.set(-1.2, 1.4, 0);
    const band2 = band1.clone();
    band2.position.x = 1.2;
    group.add(body, lid, clasp, band1, band2);
    group.position.set(x, y, z);
    scene.add(group);

    // a spinning gem and a soft glow so the chest can be seen from far away
    this.gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), gold);
    this.gem.position.set(x, y + 5, z);
    scene.add(this.gem);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.15, depthWrite: false }),
    );
    glow.position.set(x, y + 3, z);
    scene.add(glow);
  }

  isNear(position, distance = 5) {
    return Math.hypot(position.x - this.x, position.z - this.z) < distance
      && Math.abs(position.y - this.baseY) < 8;
  }

  update(time) {
    this.gem.rotation.y = time * 1.5;
    this.gem.position.y = this.baseY + 5 + Math.sin(time * 2) * 0.3;
  }
}
