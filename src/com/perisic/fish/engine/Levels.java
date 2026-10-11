package com.perisic.fish.engine;

/**
 * The list of maps in the game. New levels are added here.
 */
public final class Levels {

	private static final String[] NAMES = { "The Shallows" };

	private static final String[][] MAPS = {
			{ "###############",
			  "#P....#.......#",
			  "#.###.#.#####.#",
			  "#.#...#.#...#.#",
			  "#.#.#####.#.#.#",
			  "#.#.....#.#...#",
			  "#.#######.#####",
			  "#...C.....C..E#",
			  "###############" } };

	private Levels() {
		// not meant to be created
	}

	public static int count() {
		return MAPS.length;
	}

	/** Returns a fresh copy of a level (gates closed again). */
	public static Level get(int index) {
		return new Level(NAMES[index], MAPS[index]);
	}
}