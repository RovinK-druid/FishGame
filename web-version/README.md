# Fish Counter - web version

A 3D underwater adventure built with HTML, CSS, JavaScript and Three.js, with a Node.js server.
The Fish Game API (https://marcconrad.com/uob/fish/doc.php) provides the checkpoint puzzles.

## Run it
1. Install Node.js (LTS) from https://nodejs.org
2. In this folder run: `npm install`
3. Start the server: `npm start`
4. Open http://localhost:3000 in Chrome (do not open index.html directly)

## Controls
- W/S or Up/Down arrows: swim forward/back
- A/D or Left/Right arrows: turn
- Space: up. Shift: down
- E at a gate: open the fish-counting puzzle. Click or press 0-9 to answer. Esc closes it.

## How to play
Swim from the start through two glowing gates to the treasure chest. Rock walls and closed gates
block the way. To open a gate, count the fish in a picture (ignore the treasure chests).

## How the Fish API is used
Browser -> our Node server -> Fish Game API.
- `POST /api/puzzle`: the server asks the Fish API for a picture and keeps the answer itself.
  The browser only receives the picture and a random puzzle id.
- `POST /api/puzzle/:id/answer`: the browser sends a guess (0-9); the server replies correct or not.

## Status
- Day 1: 3D underwater scene and swimmable fish.
- Day 2: reef level with rock collisions, two gates, a treasure chest and a timer.
- Day 3: Fish API puzzles at the gates (through our own server).
- Next: login with hashed passwords, "remember me" cookie, saved scores.
