package com.perisic.fish.engine;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/**
 * Stores player accounts in a local text file and checks logins.
 * Passwords are NEVER saved. For every account only a random salt and a
 * PBKDF2 hash of the password are saved.
 * 
 * File format (one account per line):  username:salt:hash   (salt and hash are Base64)
 * 
 * Written by me with help from Claude (AI assistant). This is the virtual identity
 * part of the game.
 */
public class UserStore {

	private static final int ITERATIONS = 120000; // makes each guess slow for an attacker
	private static final int SALT_BYTES = 16; // random salt, different for every account
	private static final int KEY_BITS = 256; // length of the hash

	private final Path file;
	private final SecureRandom random = new SecureRandom();

	/** Accounts are saved in users.txt in the project folder. */
	public UserStore() {
		this("users.txt");
	}

	public UserStore(String fileName) {
		file = Paths.get(fileName);
	}

	/**
	 * Creates a new account.
	 * 
	 * @return null if the account was created, otherwise a message explaining the problem.
	 */
	public String register(String username, String password, String confirm) {
		if (username == null || !username.matches("[A-Za-z0-9_]{3,20}")) {
			return "Username must be 3-20 characters: letters, numbers or _ only.";
		}
		if (password == null || password.length() < 8) {
			return "Password must be at least 8 characters.";
		}
		if (!password.equals(confirm)) {
			return "The two passwords do not match.";
		}
		if (findUser(username) != null) {
			return "That username is already taken.";
		}

		byte[] salt = new byte[SALT_BYTES];
		random.nextBytes(salt);
		byte[] hash = hash(password, salt);

		String line = username + ":" + Base64.getEncoder().encodeToString(salt) + ":"
				+ Base64.getEncoder().encodeToString(hash);
		try {
			Files.write(file, List.of(line), StandardCharsets.UTF_8, StandardOpenOption.CREATE,
					StandardOpenOption.APPEND);
		} catch (IOException e) {
			return "Could not save the account: " + e.getMessage();
		}
		return null;
	}

	/**
	 * Returns true if the password matches the one used when the account was created.
	 */
	public boolean checkPassword(String username, String password) {
		if (username == null || password == null) {
			return false;
		}
		String[] parts = findUser(username);
		if (parts == null) {
			return false;
		}
		byte[] salt = Base64.getDecoder().decode(parts[1]);
		byte[] expected = Base64.getDecoder().decode(parts[2]);
		byte[] actual = hash(password, salt);
		// isEqual takes the same time however many bytes match (stops timing attacks)
		return MessageDigest.isEqual(expected, actual);
	}

	/** Looks up an account line. Returns {username, salt, hash} or null. */
	private String[] findUser(String username) {
		for (String line : readLines()) {
			String[] parts = line.split(":");
			if (parts.length == 3 && parts[0].equalsIgnoreCase(username)) {
				return parts;
			}
		}
		return null;
	}

	private List<String> readLines() {
		if (!Files.exists(file)) {
			return new ArrayList<String>();
		}
		try {
			return Files.readAllLines(file, StandardCharsets.UTF_8);
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	/** PBKDF2 with HMAC-SHA256: a standard, deliberately slow password hash. */
	private static byte[] hash(String password, byte[] salt) {
		PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_BITS);
		try {
			return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
		} catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
			throw new IllegalStateException("Password hashing is not available", e);
		} finally {
			spec.clearPassword();
		}
	}
}