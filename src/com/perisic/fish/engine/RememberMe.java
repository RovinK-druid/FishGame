package com.perisic.fish.engine;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * "Remember me" for the desktop game. It works like a web cookie:
 * 
 * - CLIENT file (remember.txt): username and a random token. This is the "cookie" kept on the
 * player's computer.
 * - SERVER file (tokens.txt): username, a HASH of the token and an expiry time. The token itself
 * is not stored here, so reading this file does not let anyone log in.
 * 
 * When the game starts, the token from the client file is hashed and compared with the server
 * file. If it matches and has not expired, the player is logged in without typing a password.
 * 
 * Written by me with help from Claude (AI assistant).
 */
public class RememberMe {

	private static final long VALID_DAYS = 7;

	private final Path clientFile;
	private final Path serverFile;
	private final SecureRandom random = new SecureRandom();

	public RememberMe() {
		this("remember.txt", "tokens.txt");
	}

	public RememberMe(String clientName, String serverName) {
		clientFile = Paths.get(clientName);
		serverFile = Paths.get(serverName);
	}

	/** Called after a successful login when "Remember me" is ticked. */
	public void issue(String username) {
		byte[] raw = new byte[32]; // 256 random bits
		random.nextBytes(raw);
		String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
		long expiry = System.currentTimeMillis() + VALID_DAYS * 24L * 60 * 60 * 1000;

		List<String> server = readLines(serverFile);
		server.removeIf(line -> line.split(":")[0].equalsIgnoreCase(username)); // one token per player
		server.add(username + ":" + hashToken(token) + ":" + expiry);
		writeLines(serverFile, server);

		List<String> client = new ArrayList<String>();
		client.add(username + ":" + token);
		writeLines(clientFile, client);
	}

	/**
	 * Returns the username if a valid, unexpired token is saved on this computer, otherwise null.
	 */
	public String load() {
		List<String> client = readLines(clientFile);
		if (client.isEmpty()) {
			return null;
		}
		String[] c = client.get(0).split(":");
		if (c.length != 2) {
			forget();
			return null;
		}
		String username = c[0];
		String tokenHash = hashToken(c[1]);

		for (String line : readLines(serverFile)) {
			String[] s = line.split(":");
			if (s.length == 3 && s[0].equalsIgnoreCase(username)) {
				try {
					boolean sameHash = MessageDigest.isEqual(s[1].getBytes(StandardCharsets.UTF_8),
							tokenHash.getBytes(StandardCharsets.UTF_8));
					boolean notExpired = Long.parseLong(s[2]) > System.currentTimeMillis();
					if (sameHash && notExpired) {
						return username;
					}
				} catch (NumberFormatException e) {
					// damaged line: treat as invalid
				}
			}
		}
		forget(); // token wrong or expired: remove it
		return null;
	}

	/** Called on log out (or when a login is made without "Remember me"). */
	public void forget() {
		List<String> client = readLines(clientFile);
		if (!client.isEmpty()) {
			final String username = client.get(0).split(":")[0];
			List<String> server = readLines(serverFile);
			server.removeIf(line -> line.split(":")[0].equalsIgnoreCase(username));
			writeLines(serverFile, server);
		}
		try {
			Files.deleteIfExists(clientFile);
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	/**
	 * SHA-256 is fine here (unlike for passwords) because the token is 256 random bits,
	 * so it cannot be guessed and does not need a slow hash.
	 */
	private static String hashToken(String token) {
		try {
			byte[] h = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
			return Base64.getEncoder().encodeToString(h);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 not available", e);
		}
	}

	private static List<String> readLines(Path file) {
		if (!Files.exists(file)) {
			return new ArrayList<String>();
		}
		try {
			return new ArrayList<String>(Files.readAllLines(file, StandardCharsets.UTF_8));
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	private static void writeLines(Path file, List<String> lines) {
		try {
			Files.write(file, lines, StandardCharsets.UTF_8);
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}
}