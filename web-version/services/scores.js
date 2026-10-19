// services/scores.js - saved scores. Each player keeps only their best result.
// The score is calculated HERE on the server from the time and the mistakes, so the browser
// cannot simply send "score: 99999".


import path from 'node:path';
import { readJson, writeJson } from './jsonFile.js';

export class ScoreStore {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'scores.json');
    // lowercase username -> { username, score, seconds, mistakes, date }
    this.best = new Map(Object.entries(readJson(this.file, {})));
  }

  save() {
    writeJson(this.file, Object.fromEntries(this.best));
  }

  /** 1000 points, minus 3 per second and 50 per wrong answer (never below 0). */
  static calculate(seconds, mistakes) {
    return Math.max(0, 1000 - Math.round(seconds) * 3 - mistakes * 50);
  }

  /** All players, best first. Equal scores: the faster time wins. */
  sorted() {
    return [...this.best.values()].sort(
      (a, b) => b.score - a.score || a.seconds - b.seconds || a.date.localeCompare(b.date),
    );
  }

  rankOf(username) {
    const list = this.sorted();
    const index = list.findIndex((e) => e.username.toLowerCase() === username.toLowerCase());
    return index < 0 ? null : { rank: index + 1, score: list[index].score };
  }

  /** Saves a finished run. Returns { score, personalBest, rank }. */
  submit(username, seconds, mistakes) {
    const score = ScoreStore.calculate(seconds, mistakes);
    const key = username.toLowerCase();
    const old = this.best.get(key);
    const personalBest = !old || score > old.score;
    if (personalBest) {
      this.best.set(key, {
        username, score, seconds: Math.round(seconds), mistakes, date: new Date().toISOString(),
      });
      this.save();
    }
    const rank = this.rankOf(username);
    return { score, personalBest, rank: rank ? rank.rank : null };
  }

  /** The best n players for the high score table. */
  top(n) {
    return this.sorted().slice(0, n).map((e, i) => ({
      rank: i + 1, username: e.username, score: e.score, seconds: e.seconds,
    }));
  }
}
