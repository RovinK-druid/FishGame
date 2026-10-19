// services/sessions.js - logged-in sessions and the "remember me" cookie.
//
// When a player logs in, the server makes a random token and sends it to the browser in a cookie.
// The server keeps only a HASH of the token (like a password), so someone who reads the data file
// cannot use it to log in. On every request the browser sends the cookie back and the server
// looks the token up.
//
//  - normal login:   a "session cookie" (the browser forgets it when it is closed), valid 12 hours
//  - "remember me":  a persistent cookie that lasts 7 days.

import { randomBytes, createHash } from 'node:crypto';
import path from 'node:path';
import { readJson, writeJson } from './jsonFile.js';

export const COOKIE_NAME = 'fish_session';
const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000;
const SHORT_MS = 12 * 60 * 60 * 1000;

function sha256(text) {
  return createHash('sha256').update(text).digest('base64');
}

export class SessionStore {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'sessions.json');
    // hash of token -> { username, expires }
    this.sessions = new Map(Object.entries(readJson(this.file, {})));
    this.removeExpired();
  }

  save() {
    writeJson(this.file, Object.fromEntries(this.sessions));
  }

  removeExpired() {
    const now = Date.now();
    let changed = false;
    for (const [key, session] of this.sessions) {
      if (session.expires < now) {
        this.sessions.delete(key);
        changed = true;
      }
    }
    if (changed) {
      this.save();
    }
  }

  /**
   * Starts a session. Returns { token, maxAgeMs }; maxAgeMs is null for a normal session cookie.
   * A token is 256 random bits, so it cannot be guessed.
   */
  create(username, remember) {
    this.removeExpired();
    const token = randomBytes(32).toString('base64url');
    const lifetime = remember ? REMEMBER_MS : SHORT_MS;
    this.sessions.set(sha256(token), { username, expires: Date.now() + lifetime });
    this.save();
    return { token, maxAgeMs: remember ? REMEMBER_MS : null };
  }

  /** Returns the username for a token, or null if it is unknown or expired. */
  find(token) {
    if (typeof token !== 'string' || token === '') {
      return null;
    }
    const key = sha256(token);
    const session = this.sessions.get(key);
    if (!session) {
      return null;
    }
    if (session.expires < Date.now()) {
      this.sessions.delete(key);
      this.save();
      return null;
    }
    return session.username;
  }

  destroy(token) {
    if (typeof token === 'string' && this.sessions.delete(sha256(token))) {
      this.save();
    }
  }
}
