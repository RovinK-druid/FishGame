// services/jsonFile.js - read and write small JSON data files (accounts, sessions, scores).
// The file is written to a temporary name first and then renamed, so a crash in the middle of
// saving cannot leave a half-written file behind.


import fs from 'node:fs';
import path from 'node:path';

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback; // file missing or damaged: start empty
  }
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, file);
}
