// physics.js - simple collisions between the fish (a sphere) and the obstacles.
// A collider is either
//   { type: 'sphere', x, y, z, r }               (rocks)
//   { type: 'box', x, y, z, hx, hy, hz }         (gate barriers; hx/hy/hz are half sizes)
// A collider with enabled === false is ignored (an opened gate).
// This module knows nothing about meshes or the game; it only does the maths.
// Written with help from Claude (AI assistant).

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pushOutOfSphere(p, radius, c) {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const dz = p.z - c.z;
  const minDist = c.r + radius;
  const d2 = dx * dx + dy * dy + dz * dz;
  if (d2 >= minDist * minDist) {
    return; // not touching
  }
  const d = Math.sqrt(d2);
  if (d < 1e-6) {
    p.y += minDist; // exactly at the centre: just move up
    return;
  }
  const push = (minDist - d) / d; // move away along the line from the centre
  p.x += dx * push;
  p.y += dy * push;
  p.z += dz * push;
}

function pushOutOfBox(p, radius, c) {
  // the point of the box that is closest to the fish
  const cx = clamp(p.x, c.x - c.hx, c.x + c.hx);
  const cy = clamp(p.y, c.y - c.hy, c.y + c.hy);
  const cz = clamp(p.z, c.z - c.hz, c.z + c.hz);
  const dx = p.x - cx;
  const dy = p.y - cy;
  const dz = p.z - cz;
  const d2 = dx * dx + dy * dy + dz * dz;
  if (d2 >= radius * radius) {
    return; // not touching
  }
  const d = Math.sqrt(d2);
  if (d > 1e-6) {
    const push = (radius - d) / d;
    p.x += dx * push;
    p.y += dy * push;
    p.z += dz * push;
  } else {
    // the fish centre is inside the box: push it out on the nearer side (along z)
    p.z = p.z >= c.z ? c.z + c.hz + radius : c.z - c.hz - radius;
  }
}

/** Moves `position` (a Vector3) out of anything it overlaps. */
export function resolveCollisions(position, radius, colliders) {
  for (const c of colliders) {
    if (c.enabled === false) {
      continue;
    }
    if (c.type === 'sphere') {
      pushOutOfSphere(position, radius, c);
    } else if (c.type === 'box') {
      pushOutOfBox(position, radius, c);
    }
  }
}
