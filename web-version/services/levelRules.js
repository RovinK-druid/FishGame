// services/levelRules.js - what the SERVER needs to know about each level.
// The server checks scores, so it must know how many gates a level has, how fast a level can
// possibly be finished and the "par" time used for scoring. These numbers must match the levels
// in public/js/levels.js. (Trade-off: the level data exists twice, but a player cannot change
// the server's copy.)

export const LEVEL_RULES = [
  { gates: 2, parSeconds: 20, minSeconds: 8 },
  { gates: 3, parSeconds: 30, minSeconds: 12 },
  { gates: 4, parSeconds: 45, minSeconds: 20 },
];

export const LEVEL_COUNT = LEVEL_RULES.length;

/**
 * 1000 points, minus 3 for every second slower than the level's par time, minus 50 for every
 * wrong puzzle answer (never below 0). Each level has its own par time, so a long level does
 * not give lower scores than a short one.
 */
export function calculateScore(level, seconds, mistakes) {
  const rule = LEVEL_RULES[level - 1];
  const slowSeconds = Math.max(0, Math.round(seconds) - rule.parSeconds);
  return Math.max(0, 1000 - slowSeconds * 3 - mistakes * 50);
}
