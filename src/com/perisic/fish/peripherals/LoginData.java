package com.perisic.fish.peripherals;

import com.perisic.fish.engine.UserStore;

/**
 * Based on the unit example by Marc Conrad, which had one hard-coded user.
 * Now it passes the work on to UserStore (saved accounts, hashed passwords).
 * Changed by me with help from Claude (AI assistant).
 */
public class LoginData {

	private final UserStore store = new UserStore();

	/**
	 * Returns true if passwd matches the username given.
	 */
	boolean checkPassword(String username, String passwd) {
		return store.checkPassword(username, passwd);
	}

	/**
	 * Creates an account. Returns null on success, otherwise an error message.
	 */
	String register(String username, String passwd, String confirm) {
		return store.register(username, passwd, confirm);
	}
}