package com.perisic.fish.engine;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * Saves each player's best score in a local text file (scores.txt), one line per player:
 * name:bestScore
 * 
 * Written by me with help from Claude (AI assistant).
 */
public class ScoreStore {

	/** One row of the high score table. */
	public static class Entry {
		public final String name;
		public final int score;

		public Entry(String name, int score) {
			this.name = name;
			this.score = score;
		}
	}

	private final Path file;

	public ScoreStore() {
		this("scores.txt");
	}

	public ScoreStore(String fileName) {
		file = Paths.get(fileName);
	}

	/**
	 * Records a finished game. Only the player's best score is kept.
	 * 
	 * @return true if this is a new personal best.
	 */
	public boolean addScore(String player, int score) {
		if (player == null || score <= 0) {
			return false;
		}
		List<Entry> all = readAll();
		boolean found = false;
		boolean improved = false;
		for (int i = 0; i < all.size(); i++) {
			Entry e = all.get(i);
			if (e.name.equalsIgnoreCase(player)) {
				found = true;
				if (score > e.score) {
					all.set(i, new Entry(e.name, score));
					improved = true;
				}
			}
		}
		if (!found) {
			all.add(new Entry(player, score));
			improved = true;
		}
		if (improved) {
			writeAll(all);
		}
		return improved;
	}

	/** The n best players, highest score first. */
	public List<Entry> top(int n) {
		List<Entry> all = readAll();
		all.sort((a, b) -> Integer.compare(b.score, a.score));
		if (all.size() > n) {
			return new ArrayList<Entry>(all.subList(0, n));
		}
		return all;
	}

	private List<Entry> readAll() {
		List<Entry> result = new ArrayList<Entry>();
		if (!Files.exists(file)) {
			return result;
		}
		try {
			for (String line : Files.readAllLines(file, StandardCharsets.UTF_8)) {
				String[] parts = line.split(":");
				if (parts.length == 2) {
					try {
						result.add(new Entry(parts[0], Integer.parseInt(parts[1])));
					} catch (NumberFormatException e) {
						// skip damaged line
					}
				}
			}
		} catch (IOException e) {
			System.err.println("Could not read scores: " + e.getMessage());
		}
		return result;
	}

	private void writeAll(List<Entry> all) {
		List<String> lines = new ArrayList<String>();
		for (Entry e : all) {
			lines.add(e.name + ":" + e.score);
		}
		try {
			Files.write(file, lines, StandardCharsets.UTF_8);
		} catch (IOException e) {
			System.err.println("Could not save scores: " + e.getMessage());
		}
	}
}