// server.js - Fish Counter web server (Day 1)
// Serves the game files to the browser. Later days add login, scores and the Fish API proxy here.


import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// The game itself: HTML, CSS and JavaScript in the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Three.js is installed with npm and served from node_modules,
// so the game does not need any outside CDN.
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/vendor/three-addons', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));

app.listen(PORT, () => {
  console.log(`Fish Counter is running at http://localhost:${PORT}`);
});
