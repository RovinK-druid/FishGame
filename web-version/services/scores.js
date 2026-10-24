// services/scores.js - saved scores. Every player keeps their best result for each level.
// Scores are calculated HERE on the server (see levelRules.js), so the browser cannot simply
// send "score: 99999". The overall table adds up each player's best score of every level.
// Level progress is worked out from the scores: you unlock level N+1 by finishing level N.


import path from 'node:path';
import { readJson, writeJson } from './jsonFile.js';
import { LEVEL_COUNT, calculateScore } from './levelRules.js';

export class ScoreStore {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'scores.json');
    // level number -> Map( lowercase username -> { username, score, seconds, mistakes, date } )
    this.levels = new Map();
    const raw = readJson(this.file, {});
    // Old files (from before there were levels) hold the entries directly: they were level 1.
    const isOldFormat = Object.values(raw).some((value) => value && typeof value.score === 'number');
    const data = isOldFormat ? { 1: raw } : raw;
    for (const [level, entries] of Object.entries(data)) {
      this.levels.set(Number(level), new Map(Object.entries(entries)));
    }
  }

  save() {
    const data = {};
    for (const [level, entries] of this.levels) {
      data[level] = Object.fromEntries(entries);
    }
    writeJson(this.file, data);
  }

  entries(level) {
    if (!this.levels.has(level)) {
      this.levels.set(level, new Map());
    }
    return this.levels.get(level);
  }

  /** A player's best entry for a level, or null. */
  best(username, level) {
    return this.entries(level).get(username.toLowerCase()) ?? null;
  }

  /** All players of a level, best first. Equal scores: the faster time wins. */
  sorted(level) {
    return [...this.entries(level).values()].sort(
      (a, b) => b.score - a.score || a.seconds - b.seconds || a.date.localeCompare(b.date),
    );
  }

  rankOf(username, level) {
    const list = this.sorted(level);
    const index = list.findIndex((e) => e.username.toLowerCase() === username.toLowerCase());
    return index < 0 ? null : { rank: index + 1, score: list[index].score };
  }

  /** The best n players of one level for the high score table. */
  top(level, n) {
    return this.sorted(level).slice(0, n).map((e, i) => ({
      rank: i + 1, username: e.username, score: e.score, seconds: e.seconds,
    }));
  }

  /** Each player's total: the sum of their best scores over all levels. */
  totals() {
    const totals = new Map(); // lowercase name -> { username, score, levels }
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      for (const [key, entry] of this.entries(level)) {
        const t = totals.get(key) ?? { username: entry.username, score: 0, levels: 0 };
        t.score += entry.score;
        t.levels += 1;
        totals.set(key, t);
      }
    }
    return [...totals.values()].sort(
      (a, b) => b.score - a.score || b.levels - a.levels || a.username.localeCompare(b.username),
    );
  }

  overall(n) {
    return this.totals().slice(0, n).map((t, i) => ({ rank: i + 1, ...t }));
  }

  overallRank(username) {
    const list = this.totals();
    const index = list.findIndex((t) => t.username.toLowerCase() === username.toLowerCase());
    return index < 0 ? null : { rank: index + 1, score: list[index].score };
  }

  /** The highest level the player may play: one more than the last level they finished in order. */
  unlockedLevel(username) {
    let unlocked = 1;
    for (let level = 1; level < LEVEL_COUNT; level++) {
      if (this.best(username, level)) {
        unlocked = level + 1;
      } else {
        break;
      }
    }
    return unlocked;
  }

  /** What the level select screen needs: how far the player got and their best scores. */
  progress(username) {
    const bests = [];
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      const entry = this.best(username, level);
      bests.push(entry ? entry.score : null);
    }
    return { unlocked: this.unlockedLevel(username), bests };
  }

  /** Saves a finished run. Returns { score, personalBest, rank, newlyUnlocked }. */
  submit(username, level, seconds, mistakes) {
    const unlockedBefore = this.unlockedLevel(username);
    const score = calculateScore(level, seconds, mistakes);
    const old = this.best(username, level);
    const personalBest = !old || score > old.score;
    if (personalBest) {
      this.entries(level).set(username.toLowerCase(), {
        username, score, seconds: Math.round(seconds), mistakes, date: new Date().toISOString(),
      });
      this.save();
    }
    const unlockedAfter = this.unlockedLevel(username);
    const rank = this.rankOf(username, level);
    return {
      score,
      personalBest,
      rank: rank ? rank.rank : null,
      newlyUnlocked: unlockedAfter > unlockedBefore ? unlockedAfter : null,
    };
  }
}
