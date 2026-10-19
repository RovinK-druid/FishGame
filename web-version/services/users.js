// services/users.js - player accounts (virtual identity).
//
// Passwords are NEVER saved. For each account only a random salt and a scrypt hash are saved.
//  - salt: random bytes, different for every account, so two players with the same password
//    get different hashes and ready-made "rainbow tables" are useless.
//  - scrypt: a deliberately slow, memory-hungry hash, so guessing passwords is expensive.
// Users are kept in a Map (not a plain object) so a username such as "__proto__" cannot
// cause trouble.


import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';
import { readJson, writeJson } from './jsonFile.js';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const USERNAME_RULE = /^[A-Za-z0-9_]{3,20}$/;
const DUMMY_SALT = randomBytes(16); // used when the username does not exist (see verify)

function hashPassword(password, salt) {
  return scryptAsync(password, salt, KEY_LENGTH);
}

export class UserStore {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'users.json');
    // lowercase username -> { username, salt, hash, created }
    this.users = new Map(Object.entries(readJson(this.file, {})));
  }

  save() {
    writeJson(this.file, Object.fromEntries(this.users));
  }

  /** Creates an account. Returns { username } or { error }. */
  async register(username, password) {
    if (typeof username !== 'string' || !USERNAME_RULE.test(username)) {
      return { error: 'Username must be 3-20 letters, numbers or _.' };
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 100) {
      return { error: 'Password must be 8 to 100 characters.' };
    }
    const key = username.toLowerCase();
    if (this.users.has(key)) {
      return { error: 'That username is already taken.' };
    }

    const salt = randomBytes(16);
    const hash = await hashPassword(password, salt);
    if (this.users.has(key)) { // someone registered the same name while we were hashing
      return { error: 'That username is already taken.' };
    }
    this.users.set(key, {
      username,
      salt: salt.toString('base64'),
      hash: hash.toString('base64'),
      created: new Date().toISOString(),
    });
    this.save();
    return { username };
  }

  /** Returns the username if the password is right, otherwise null. */
  async verify(username, password) {
    const user = typeof username === 'string' ? this.users.get(username.toLowerCase()) : undefined;
    const salt = user ? Buffer.from(user.salt, 'base64') : DUMMY_SALT;
    // The slow hash is always calculated, so an unknown username takes about as long as a wrong
    // password. That stops attackers finding out which usernames exist by timing the replies.
    const hash = await hashPassword(typeof password === 'string' ? password : '', salt);
    if (!user) {
      return null;
    }
    const expected = Buffer.from(user.hash, 'base64');
    // timingSafeEqual takes the same time however many bytes match
    if (expected.length === hash.length && timingSafeEqual(expected, hash)) {
      return user.username;
    }
    return null;
  }
}
