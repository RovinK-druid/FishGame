// services/fishApi.js - talks to the external Fish Game API (interoperability).
//
// The Fish Game API replies with ONE line of CSV text:
//     <Base64-encoded picture>,<number of fish>,<one more value that the game does not need>
// (the unit's Java example also uses only the first two values).
// This module sends the HTTP request, checks the reply and turns it into a JavaScript object.
// Nothing else in the game needs to know how the Fish API formats its data
// (low coupling: if the API changes, only this file changes).
//
// Written with help from Claude (AI assistant).

const FISH_API_URL = process.env.FISH_API_URL || 'https://marcconrad.com/uob/fish/api.php?out=csv&base64=yes';
const TIMEOUT_MS = 8000;

/** Works out the picture type from the first characters of the Base64 text. */
function detectMime(base64) {
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  return 'image/png';
}

/**
 * Gets one puzzle from the Fish Game API.
 * @returns {Promise<{imageBase64: string, mime: string, solution: number}>}
 * @throws an Error if the service cannot be reached or its reply is not understood.
 */
export async function fetchFishPuzzle() {
  const response = await fetch(FISH_API_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`The Fish API answered with status ${response.status}`);
  }

  // some services add "data:image/png;base64," in front of the picture; remove it if present
  const text = (await response.text()).trim().replace(/^data:[^;]+;base64,/, '');

  // Base64 never contains a comma, so the values can be split on commas:
  //   parts[0] = the picture, parts[1] = the number of fish
  const parts = text.split(',');
  if (parts.length < 2) {
    throw new Error('Unexpected reply from the Fish API (expected picture,answer)');
  }
  const imageBase64 = parts[0].trim();
  const solution = Number.parseInt(parts[1].trim(), 10);

  if (!imageBase64 || !Number.isInteger(solution) || solution < 0 || solution > 9) {
    throw new Error('Unexpected reply from the Fish API (bad picture or answer)');
  }
  return { imageBase64, mime: detectMime(imageBase64), solution };
}
