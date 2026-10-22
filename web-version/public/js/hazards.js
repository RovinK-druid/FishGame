// hazards.js - moves the predators and checks whether the player touched a mine or a predator.
// It only reports what happened; the game (main.js) decides what that costs the player.


/**
 * @param level      the level object (it has .mines and .predators)
 * @param playerPos  the fish's position (a Vector3)
 * @param radius     the fish's collision radius
 * @param dt         seconds since the last frame
 * @param colliders  rocks and closed gates, so predators cannot swim through them
 * @param vulnerable false while the player is still protected after being hurt
 * @returns null, or { kind: 'mine' | 'predator', from: Vector3 } for the thing that hurt the player
 */
export function updateHazards(level, playerPos, radius, dt, colliders, vulnerable) {
  for (const predator of level.predators) {
    predator.update(dt, playerPos, colliders);
  }
  if (!vulnerable) {
    return null;
  }
  for (const mine of level.mines) {
    if (mine.touches(playerPos, radius)) {
      mine.explode();
      return { kind: 'mine', from: mine.position.clone() };
    }
  }
  for (const predator of level.predators) {
    if (predator.touches(playerPos, radius)) {
      const from = predator.position.clone();
      predator.retreat(playerPos);
      return { kind: 'predator', from };
    }
  }
  return null;
}
