package com.perisic.fish.engine;

import java.awt.image.BufferedImage;

/**
 * Main class where the games are coming from.
 * Based on the unit example by Marc Conrad.
 * Lives feature added by me with help from Claude (AI assistant).
 */
public class GameEngine {
	String thePlayer = null;

	/**
	 * Each player has their own game engine.
	 * 
	 * @param player
	 */
	public GameEngine(String player) {
		thePlayer = player;
	}

	static final int STARTING_LIVES = 3;

	int score = 0;
	int lives = STARTING_LIVES;
	GameServer theGames = new GameServer();
	Game current = null;

	/**
	 * Retrieves a game from the web service.
	 */
	public BufferedImage nextGame() {
		current = theGames.getRandomGame();
		return current.getImage();
	}

	/**
	 * Checks if i is the solution of the current game.
	 * Correct answer: score goes up by one. Wrong answer: lose a life.
	 */
	public boolean checkSolution(int i) {
		if (i == current.getSolution()) {
			score++;
			return true;
		} else {
			lives--;
			return false;
		}
	}

	public int getScore() {
		return score;
	}

	public int getLives() {
		return lives;
	}

	public boolean isGameOver() {
		return lives <= 0;
	}

	/**
	 * Starts a fresh game (score and lives are reset).
	 */
	public void reset() {
		score = 0;
		lives = STARTING_LIVES;
	}
}