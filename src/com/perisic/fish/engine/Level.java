package com.perisic.fish.engine;

/**
 * One map of the adventure: a grid of tiles.
 * No window code here - the engine only knows what is where.
 *
 * Tile letters used in the map text:
 *   #  rock (cannot swim through)
 *   .  open water
 *   P  where the player starts
 *   C  checkpoint gate (opens when a fish-counting puzzle is solved)
 *   E  exit (the treasure chest)
 */
public class Level {

	public static final char ROCK = '#';
	public static final char WATER = '.';
	public static final char GATE = 'C';
	public static final char EXIT = 'E';

	private final String name;
	private final char[][] tiles;
	private int startX = 1;
	private int startY = 1;

	public Level(String name, String[] rows) {
		this.name = name;
		tiles = new char[rows.length][rows[0].length()];
		for (int y = 0; y < rows.length; y++) {
			for (int x = 0; x < rows[y].length(); x++) {
				char c = rows[y].charAt(x);
				if (c == 'P') { // the start position is just water
					startX = x;
					startY = y;
					c = WATER;
				}
				tiles[y][x] = c;
			}
		}
	}

	public String getName() {
		return name;
	}

	public int getWidth() {
		return tiles[0].length;
	}

	public int getHeight() {
		return tiles.length;
	}

	public int getStartX() {
		return startX;
	}

	public int getStartY() {
		return startY;
	}

	/** Anything outside the map counts as rock. */
	public char getTile(int x, int y) {
		if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) {
			return ROCK;
		}
		return tiles[y][x];
	}

	/** Turns a gate into open water. */
	public void openGate(int x, int y) {
		if (getTile(x, y) == GATE) {
			tiles[y][x] = WATER;
		}
	}
}