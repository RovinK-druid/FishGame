// fishClient.js - the browser's side of the conversation with OUR server (not the Fish API itself).
// It sends JSON over HTTP using fetch() and turns server errors into readable messages.
// Written with help from Claude (AI assistant).

async function postJson(url, body) {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the game server.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // the reply had no JSON; handled below
  }
  if (!response.ok) {
    throw new Error((data && data.error) || `Server error (${response.status}).`);
  }
  return data;
}

/** Asks the server for a new puzzle. Resolves to { id, image }. */
export function requestPuzzle() {
  return postJson('/api/puzzle');
}

/** Sends the player's answer. Resolves to { correct }. */
export function submitAnswer(id, guess) {
  return postJson(`/api/puzzle/${encodeURIComponent(id)}/answer`, { guess });
}
