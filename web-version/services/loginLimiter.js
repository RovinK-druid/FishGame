// services/loginLimiter.js - slows down password guessing.
// After 5 wrong passwords for a username, further logins for that username are refused for
// 10 minutes. (Trade-off: someone could lock a player out on purpose; a real service would also
// limit by IP address or use a CAPTCHA.)


const MAX_FAILS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export class LoginLimiter {
  constructor() {
    this.attempts = new Map(); // username -> { fails, first }
  }

  isBlocked(key) {
    const entry = this.attempts.get(key);
    if (!entry) {
      return false;
    }
    if (Date.now() - entry.first > WINDOW_MS) {
      this.attempts.delete(key);
      return false;
    }
    return entry.fails >= MAX_FAILS;
  }

  recordFailure(key) {
    const now = Date.now();
    const entry = this.attempts.get(key);
    if (!entry || now - entry.first > WINDOW_MS) {
      this.attempts.set(key, { fails: 1, first: now });
    } else {
      entry.fails += 1;
    }
  }

  clear(key) {
    this.attempts.delete(key);
  }
}
