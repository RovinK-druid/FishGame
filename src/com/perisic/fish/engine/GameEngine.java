package com.perisic.fish.engine;

import java.awt.image.BufferedImage;

/**
 * Main class where the games are coming from.
 * Based on the unit example by Marc Conrad.
 * 
 * This class only contains the game RULES. It knows nothing about windows or buttons.
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
	static final int CORRECT_PER_LEVEL = 5; // a new level every 5 correct answers
	static final int BASE_TIME_SECONDS = 15; // time per round at level 1
	static final int MIN_TIME_SECONDS = 5; // the timer never gets shorter than this

	int score = 0;
	int lives = STARTING_LIVES;
	int streak = 0; // correct answers in a row
	int correctCount = 0; // total correct answers in this game
	int highScore = 0; // best score in this session

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
	 * Correct: points are added (more points for a longer streak). Wrong: lose a life.
	 */
	public boolean checkSolution(int i) {
		if (i == current.getSolution()) {
			streak++;
			correctCount++;
			score += pointsForStreak(streak);
			if (score > highScore) {
				highScore = score;
			}
			return true;
		} else {
			loseLife();
			return false;
		}
	}

	/**
	 * Called by the GUI when the round timer runs out.
	 */
	public void timeExpired() {
		loseLife();
	}

	private void loseLife() {
		lives--;
		streak = 0;
	}

	/** 10 points, plus 5 bonus for every extra answer in the streak (max +20). */
	private int pointsForStreak(int s) {
		int bonus = Math.min(s - 1, 4) * 5;
		return 10 + bonus;
	}

	/** The level goes up every CORRECT_PER_LEVEL correct answers. */
	public int getLevel() {
		return correctCount / CORRECT_PER_LEVEL + 1;
	}

	/** Higher levels give less time (2 seconds less per level, minimum 5). */
	public int getTimeLimitSeconds() {
		return Math.max(MIN_TIME_SECONDS, BASE_TIME_SECONDS - (getLevel() - 1) * 2);
	}

	/** Used to tell the player the right answer when time runs out. */
	public int getCurrentSolution() {
		return current.getSolution();
	}

	public int getScore() {
		return score;
	}

	public int getLives() {
		return lives;
	}

	public int getStreak() {
		return streak;
	}

	public int getHighScore() {
		return highScore;
	}

	public boolean isGameOver() {
		return lives <= 0;
	}

	/**
	 * Starts a fresh game. The high score is kept.
	 */
	public void reset() {
		score = 0;
		lives = STARTING_LIVES;
		streak = 0;
		correctCount = 0;
	}
}