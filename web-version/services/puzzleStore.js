// services/puzzleStore.js - remembers the answers of the puzzles that were handed out.
//
// The browser is only ever given the PICTURE and a random puzzle id. The correct answer stays
// here on the server, so a player cannot cheat by looking at the network traffic.
// Each puzzle belongs to the player who asked for it, and it expires after a few minutes.


import { randomUUID } from 'node:crypto';

const LIFETIME_MS = 5 * 60 * 1000; // a puzzle can be answered for 5 minutes

export class PuzzleStore {
  constructor() {
    this.puzzles = new Map();
  }

  /** Saves a puzzle's answer for `owner` and returns a new random id for it. */
  create(solution, owner) {
    this.removeExpired();
    const id = randomUUID();
    this.puzzles.set(id, { solution, owner, expires: Date.now() + LIFETIME_MS });
    return id;
  }

  /**
   * Checks a guess made by `owner`.
   * @returns {{found: boolean, correct: boolean}} found is false if the id is unknown, expired
   *          or belongs to someone else. A correct answer uses the puzzle up; a wrong answer
   *          lets the player try again.
   */
  check(id, guess, owner) {
    const puzzle = this.puzzles.get(id);
    if (!puzzle || puzzle.owner !== owner || puzzle.expires < Date.now()) {
      if (puzzle && puzzle.expires < Date.now()) {
        this.puzzles.delete(id);
      }
      return { found: false, correct: false };
    }
    const correct = guess === puzzle.solution;
    if (correct) {
      this.puzzles.delete(id);
    }
    return { found: true, correct };
  }

  removeExpired() {
    const now = Date.now();
    for (const [id, puzzle] of this.puzzles) {
      if (puzzle.expires < now) {
        this.puzzles.delete(id);
      }
    }
  }
}
