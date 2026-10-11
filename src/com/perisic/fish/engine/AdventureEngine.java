package com.perisic.fish.engine;

import java.awt.image.BufferedImage;

/**
 * The rules of the adventure: moving around the map, gates, and the fish-counting puzzles
 * that open them. The puzzles come from the Fish Game API (through GameServer).
 * No window code here (low coupling): the GUI only asks this class what happened.
 */
public class AdventureEngine {

	/** What happened when the player tried to move. */
	public enum MoveResult {
		BLOCKED, MOVED, CHECKPOINT, EXIT
	}

	private final GameServer server;
	private Level level;
	private int levelIndex = 0;

	private int playerX;
	private int playerY;
	private int gateX; // the gate the player is standing in front of
	private int gateY;

	private int steps = 0;
	private int mistakes = 0;
	private int gatesOpened = 0;
	private int totalScore = 0;

	private Game puzzle = null;

	public AdventureEngine() {
		this(new GameServer());
	}

	public AdventureEngine(GameServer server) {
		this.server = server;
		loadLevel(0);
	}

	public void loadLevel(int index) {
		levelIndex = index;
		level = Levels.get(index);
		playerX = level.getStartX();
		playerY = level.getStartY();
		steps = 0;
		mistakes = 0;
		gatesOpened = 0;
	}

	/** Tries to move the player by (dx, dy). */
	public MoveResult move(int dx, int dy) {
		int nx = playerX + dx;
		int ny = playerY + dy;
		char tile = level.getTile(nx, ny);

		if (tile == Level.ROCK) {
			return MoveResult.BLOCKED;
		}
		if (tile == Level.GATE) {
			gateX = nx; // remember which gate, so we can open it if the puzzle is solved
			gateY = ny;
			return MoveResult.CHECKPOINT;
		}
		playerX = nx;
		playerY = ny;
		steps++;
		if (tile == Level.EXIT) {
			return MoveResult.EXIT;
		}
		return MoveResult.MOVED;
	}

	/**
	 * Gets a new fish-counting puzzle from the Fish Game API.
	 * 
	 * @return the picture, or null if the web service could not be reached.
	 */
	public BufferedImage loadPuzzle() {
		try {
			puzzle = server.getRandomGame();
		} catch (Exception e) {
			puzzle = null;
		}
		return (puzzle == null) ? null : puzzle.getImage();
	}

	/**
	 * Checks the player's answer. A correct answer opens the gate; a wrong one counts as a mistake.
	 */
	public boolean checkPuzzle(int guess) {
		if (puzzle != null && guess == puzzle.getSolution()) {
			level.openGate(gateX, gateY);
			gatesOpened++;
			return true;
		}
		mistakes++;
		return false;
	}

	/** Called when the exit is reached. Returns the score for this level and adds it to the total. */
	public int completeLevel() {
		int score = Math.max(0, 1000 - steps * 5 - mistakes * 50);
		totalScore += score;
		return score;
	}

	public boolean hasNextLevel() {
		return levelIndex + 1 < Levels.count();
	}

	public void nextLevel() {
		loadLevel(levelIndex + 1);
	}

	/** Starts again from level 1 with a score of 0. */
	public void restart() {
		totalScore = 0;
		loadLevel(0);
	}

	public Level getLevel() {
		return level;
	}

	public int getLevelNumber() {
		return levelIndex + 1;
	}

	public int getPlayerX() {
		return playerX;
	}

	public int getPlayerY() {
		return playerY;
	}

	public int getSteps() {
		return steps;
	}

	public int getMistakes() {
		return mistakes;
	}

	public int getGatesOpened() {
		return gatesOpened;
	}

	public int getTotalScore() {
		return totalScore;
	}
}