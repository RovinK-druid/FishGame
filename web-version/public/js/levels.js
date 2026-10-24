// levels.js - the data of every level. There is no drawing code here, only numbers.
// To make a new level, add one more entry to LEVELS (and one to services/levelRules.js).
//
// Each level has:
//   name       shown on the level select screen
//   seed       makes the rock walls look the same every time
//   start      where the fish begins (z = -66 is the "south" edge, the chest is at the far end)
//   chest      the treasure (x, z)
//   walls      rock walls across the reef, each with a gap closed by a gate:
//              z = where the wall is, gapX = where the gap is, gap = half the width of the gap
//   mines      floating sea mines as [x, height, z]
//   predators  { x, y, z, zone, chaseSpeed?, detectRange? }: start place, the area they wander in,
//              and (optional) how fast they chase and how far away they notice the player


export const LEVELS = [
  {
    name: 'The Shallows',
    seed: 7,
    start: { x: 0, y: 6, z: -66 },
    chest: { x: 0, z: 58 },
    walls: [
      { z: -35, gapX: -18, gap: 5.5 },
      { z: 10, gapX: 20, gap: 5.5 },
    ],
    mines: [
      // area 1: from the start to wall 1
      [-8, 6, -57], [9, 9, -52], [-2, 8, -44], [14, 5, -64],
      // area 2: between the two walls
      [-30, 7, -18], [0, 9, -12], [28, 6, -20], [-10, 12, -4],
      // area 3: from wall 2 to the chest
      [-10, 7, 25], [12, 10, 32], [0, 6, 44], [-20, 9, 52], [30, 8, 24],
    ],
    predators: [
      { x: 10, y: 10, z: -12, zone: { minX: -72, maxX: 72, minZ: -31, maxZ: 6 } },
      { x: -25, y: 12, z: 38, zone: { minX: -72, maxX: 72, minZ: 14, maxZ: 72 } },
      { x: 35, y: 9, z: 52, zone: { minX: -72, maxX: 72, minZ: 14, maxZ: 72 } },
    ],
  },
  {
    name: 'Kelp Maze',
    seed: 11,
    start: { x: 0, y: 6, z: -68 },
    chest: { x: 0, z: 62 },
    walls: [
      { z: -45, gapX: 30, gap: 5 },
      { z: -10, gapX: -35, gap: 5 },
      { z: 25, gapX: 10, gap: 5 },
    ],
    mines: [
      [25, 7, -62], [10, 5, -56], [15, 12, -65], [-15, 6, -71],
      [3, 14, -28], [28, 7, -28], [-9, 7, -20], [-10, 8, -30], [11, 6, -32],
      [-32, 4, 9], [-20, 6, 7], [-12, 10, 9], [6, 13, 11], [-24, 8, 15],
      [-12, 13, 36], [-3, 5, 43], [12, 11, 45], [-11, 13, 50],
    ],
    predators: [
      { x: -20, y: 10, z: -28, chaseSpeed: 9.5, detectRange: 34, zone: { minX: -72, maxX: 72, minZ: -39, maxZ: -16 } },
      { x: 25, y: 12, z: 8, chaseSpeed: 9.5, detectRange: 34, zone: { minX: -72, maxX: 72, minZ: -4, maxZ: 19 } },
      { x: -30, y: 9, z: 45, chaseSpeed: 9.5, detectRange: 34, zone: { minX: -72, maxX: 72, minZ: 31, maxZ: 72 } },
      { x: 40, y: 11, z: 54, chaseSpeed: 9.5, detectRange: 34, zone: { minX: -72, maxX: 72, minZ: 31, maxZ: 72 } },
    ],
  },
  {
    name: 'Shark Alley',
    seed: 13,
    start: { x: 0, y: 6, z: -70 },
    chest: { x: 0, z: 66 },
    walls: [
      { z: -52, gapX: -40, gap: 4.5 },
      { z: -24, gapX: 40, gap: 4.5 },
      { z: 4, gapX: -40, gap: 4.5 },
      { z: 32, gapX: 38, gap: 4.5 },
    ],
    mines: [
      [-24, 13, -69], [-33, 11, -69], [-17, 8, -62], [-17, 14, -74],
      [33, 6, -35], [-10, 5, -41], [4, 11, -37], [18, 4, -41], [-31, 6, -39],
      [-4, 8, -11], [12, 8, -7], [-32, 7, -7], [-14, 9, -8], [4, 5, -13],
      [-29, 7, 21], [5, 7, 21], [13, 5, 20], [-3, 13, 16], [-21, 8, 19],
      [14, 8, 54], [31, 6, 45], [6, 13, 43], [27, 13, 53], [15, 6, 44],
    ],
    predators: [
      { x: 30, y: 10, z: -38, chaseSpeed: 10.5, detectRange: 36, zone: { minX: -72, maxX: 72, minZ: -46, maxZ: -30 } },
      { x: -25, y: 12, z: -10, chaseSpeed: 10.5, detectRange: 36, zone: { minX: -72, maxX: 72, minZ: -18, maxZ: -2 } },
      { x: 25, y: 9, z: 18, chaseSpeed: 10.5, detectRange: 36, zone: { minX: -72, maxX: 72, minZ: 10, maxZ: 26 } },
      { x: -30, y: 11, z: 50, chaseSpeed: 10.5, detectRange: 36, zone: { minX: -72, maxX: 72, minZ: 38, maxZ: 72 } },
      { x: 36, y: 8, z: 58, chaseSpeed: 10.5, detectRange: 36, zone: { minX: -72, maxX: 72, minZ: 38, maxZ: 72 } },
    ],
  },
];

/** Places where the world keeps random rocks away, so the routes stay clear. */
export function keepClearFor(def) {
  return [
    { x: def.start.x, z: def.start.z, r: 12 },
    ...def.walls.map((w) => ({ x: w.gapX, z: w.z, r: 16 })),
    { x: def.chest.x, z: def.chest.z, r: 12 },
  ];
}

/** The keep-clear places of all levels together (the random rocks are shared by every level). */
export const KEEP_CLEAR = LEVELS.flatMap(keepClearFor);
