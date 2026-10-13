# Fish Counter - web version

A 3D underwater adventure built with HTML, CSS, JavaScript and Three.js, with a Node.js server.
The Fish Game API (https://marcconrad.com/uob/fish/doc.php) provides the checkpoint puzzles.

## Run it
1. Install Node.js (LTS) from https://nodejs.org
2. In this folder run: `npm install`
3. Start the server: `npm start`
4. Open http://localhost:3000 in Chrome

## Controls
- W/S or Up/Down arrows: swim forward/back
- A/D or Left/Right arrows: turn
- Space: up. Shift: down
- E: open a gate (test mode for now)

## How to play
Swim from the start through two glowing gates to the treasure chest. Rock walls and gates block the
way. Gates will open by solving a fish-counting puzzle from the Fish Game API.

## Status
- Day 1: 3D underwater scene and swimmable fish.
- Day 2: reef level with rock collisions, two gates, a treasure chest and a timer.
- Next: the Fish API puzzle at each gate, then login and saved scores.
