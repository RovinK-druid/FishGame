// api.js - the browser's side of the conversation with OUR server (not the Fish API itself).
// Every request is JSON over HTTP using fetch(). The browser sends the login cookie by itself.
// Server errors become readable messages. If the server says "please log in" (the session ended),
// the handler registered with setUnauthorizedHandler() is called.

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(method, url, body) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin', // send the session cookie
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
    const error = new Error((data && data.error) || `Server error (${response.status}).`);
    error.status = response.status;
    const isLoginCheck = url === '/api/login' || url === '/api/me';
    if (response.status === 401 && !isLoginCheck && onUnauthorized) {
      onUnauthorized(); // the session has ended: back to the login screen
    }
    throw error;
  }
  return data;
}

// accounts
export const register = (username, password) => request('POST', '/api/register', { username, password });
export const login = (username, password, remember) => request('POST', '/api/login', { username, password, remember });
export const logout = () => request('POST', '/api/logout');
export const getMe = () => request('GET', '/api/me');

// gate puzzles
export const requestPuzzle = () => request('POST', '/api/puzzle');
export const submitAnswer = (id, guess) => request('POST', `/api/puzzle/${encodeURIComponent(id)}/answer`, { guess });

// scores
export const submitScore = (seconds, mistakes) => request('POST', '/api/scores', { seconds, mistakes });
export const getScores = () => request('GET', '/api/scores');
