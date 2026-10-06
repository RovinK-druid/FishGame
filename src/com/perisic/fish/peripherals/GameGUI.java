package com.perisic.fish.peripherals;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.image.BufferedImage;

import javax.swing.*;

import com.perisic.fish.engine.GameEngine;

/**
 * A Simple Graphical User Interface for the Fish Game.
 * Based on the unit example by Marc Conrad.
 * Lives and game-over handling added by me with help from Claude (AI assistant).
 *
 */
public class GameGUI extends JFrame implements ActionListener {

	private static final long serialVersionUID = -107785653906635L;

	/**
	 * Method that is called when a button has been pressed (this is the event handler).
	 */
	@Override
	public void actionPerformed(ActionEvent e) {
		int solution = Integer.parseInt(e.getActionCommand());
		boolean correct = myGame.checkSolution(solution);
		int score = myGame.getScore();
		int lives = myGame.getLives();
		if (correct) {
			currentGame = myGame.nextGame();
			questArea.setIcon(new ImageIcon(currentGame));
			infoArea.setText("Good!  Score: " + score + "  Lives: " + lives);
		} else if (myGame.isGameOver()) {
			JOptionPane.showMessageDialog(this, "Game over! Final score: " + score);
			myGame.reset();
			currentGame = myGame.nextGame();
			questArea.setIcon(new ImageIcon(currentGame));
			infoArea.setText("New game!  Score: 0  Lives: " + myGame.getLives());
		} else {
			infoArea.setText("Oops. Try again!  Score: " + score + "  Lives: " + lives);
		}
	}

	JLabel questArea = null;
	GameEngine myGame = null;
	BufferedImage currentGame = null;
	JTextArea infoArea = null;

	/**
	 * Initializes the game.
	 * 
	 * @param player
	 */
	private void initGame(String player) {
		setSize(690, 500);
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setTitle("How many fish are there?");
		JPanel panel = new JPanel();

		myGame = new GameEngine(player);
		currentGame = myGame.nextGame();

		infoArea = new JTextArea(1, 40);

		infoArea.setEditable(false);
		infoArea.setText("How many fish are there?   Score: 0  Lives: " + myGame.getLives());

		JScrollPane infoPane = new JScrollPane(infoArea);
		panel.add(infoPane);

		ImageIcon ii = new ImageIcon(currentGame);
		questArea = new JLabel(ii);
		questArea.setSize(330, 600);

		JScrollPane questPane = new JScrollPane(questArea);
		panel.add(questPane);

		for (int i = 0; i < 10; i++) {
			JButton btn = new JButton(String.valueOf(i));
			panel.add(btn);
			btn.addActionListener(this);
		}

		getContentPane().add(panel);
		panel.repaint();

	}

	/**
	 * Default player is null.
	 */
	public GameGUI() {
		super();
		initGame(null);
	}

	/**
	 * Use this to start GUI, e.g., after login.
	 * 
	 * @param player
	 */
	public GameGUI(String player) {
		super();
		initGame(player);
	}

	/**
	 * Main entry point into the game. Can be used without login for testing.
	 * 
	 * @param args not used.
	 */
	public static void main(String[] args) {
		GameGUI myGUI = new GameGUI();
		myGUI.setVisible(true);

	}
}