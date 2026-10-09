package com.perisic.fish.peripherals;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.FlowLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.awt.image.BufferedImage;
import java.util.List;

import javax.swing.*;
import javax.swing.border.EmptyBorder;

import com.perisic.fish.engine.GameEngine;
import com.perisic.fish.engine.RememberMe;
import com.perisic.fish.engine.ScoreStore;

/**
 * Graphical User Interface for the Fish Game.
 * Based on the unit example by Marc Conrad.
 * Layout, round timer, keyboard shortcuts, feedback, menu, high score table, log out and the underwater look
 * This class only handles DISPLAY and USER EVENTS. The rules are in GameEngine.
 */
public class GameGUI extends JFrame implements ActionListener {

	private static final long serialVersionUID = -107785653906635L;

	private static final int TICK_MS = 100; // how often the timer bar updates

	GameEngine myGame = null;
	BufferedImage currentGame = null;

	JLabel questArea = null;
	JLabel headerLabel = null;
	JLabel feedbackLabel = null;
	TimeBar timeBar = null;
	JButton[] buttons = new JButton[10];

	Timer roundTimer = null; // javax.swing.Timer: fires an event every TICK_MS
	int timeLeftMs = 0;
	String playerName = null;

	ScoreStore scoreStore = new ScoreStore();
	RememberMe remember = new RememberMe();

	/**
	 * EVENT 1: an answer button has been pressed (also called by keyboard shortcuts).
	 */
	@Override
	public void actionPerformed(ActionEvent e) {
		int solution = Integer.parseInt(e.getActionCommand());
		int levelBefore = myGame.getLevel();
		boolean correct = myGame.checkSolution(solution);

		if (correct) {
			String msg = "Correct!  Streak: " + myGame.getStreak();
			if (myGame.getLevel() > levelBefore) {
				msg = "LEVEL UP! Now level " + myGame.getLevel() + " - less time per round!";
			}
			feedbackLabel.setText(msg);
			feedbackLabel.setForeground(new Color(0, 130, 0));
			showNewImage();
		} else if (myGame.isGameOver()) {
			endGame();
		} else {
			feedbackLabel.setText("Wrong! Try again.");
			feedbackLabel.setForeground(Color.RED);
		}
		updateHeader();
	}

	/**
	 * EVENT 2: the round timer ticks (every 100 ms).
	 */
	private void onTimerTick() {
		timeLeftMs -= TICK_MS;
		timeBar.setValue(Math.max(timeLeftMs, 0));

		if (timeLeftMs < timeBar.getMaximum() * 0.3) {
			timeBar.setForeground(Color.RED); // running out of time
		}

		if (timeLeftMs <= 0) {
			roundTimer.stop();
			int answer = myGame.getCurrentSolution();
			myGame.timeExpired();
			if (myGame.isGameOver()) {
				endGame();
			} else {
				feedbackLabel.setText("Time's up! The answer was " + answer + ".");
				feedbackLabel.setForeground(Color.RED);
				showNewImage();
			}
			updateHeader();
		}
	}

	/** Loads a new image from the web service and restarts the timer. */
	private void showNewImage() {
		currentGame = myGame.nextGame();
		questArea.setIcon(new ImageIcon(currentGame));
		restartTimer();
	}

	private void restartTimer() {
		roundTimer.stop();
		timeLeftMs = myGame.getTimeLimitSeconds() * 1000;
		timeBar.setMaximum(timeLeftMs);
		timeBar.setValue(timeLeftMs);
		timeBar.setForeground(new Color(0, 170, 0));
		roundTimer.start();
	}

	/** Game over: save the score, show the result and the high score table, start again. */
	private void endGame() {
		roundTimer.stop();
		int finalScore = myGame.getScore();

		String note = "";
		if (playerName != null) {
			if (scoreStore.addScore(playerName, finalScore)) {
				note = "<br><b>New personal best!</b>";
			}
		} else {
			note = "<br>(Log in to save your scores.)";
		}

		showScoreTable("<html><h3>Game over!</h3>Final score: " + finalScore + "&nbsp;&nbsp; Level reached: "
				+ myGame.getLevel() + "<br>Best this session: " + myGame.getHighScore() + note + "</html>",
				"Game over");

		myGame.reset();
		feedbackLabel.setText("New game - good luck!");
		feedbackLabel.setForeground(Color.DARK_GRAY);
		showNewImage();
		updateHeader();
	}

	/** Shows a message with the top 5 players in a table. */
	private void showScoreTable(String summaryHtml, String title) {
		List<ScoreStore.Entry> top = scoreStore.top(5);
		String[] columns = { "Rank", "Player", "Best score" };
		Object[][] data = new Object[top.size()][3];
		for (int i = 0; i < top.size(); i++) {
			data[i][0] = i + 1;
			data[i][1] = top.get(i).name;
			data[i][2] = top.get(i).score;
		}
		JTable table = new JTable(data, columns);
		table.setEnabled(false); // read only
		JScrollPane scroll = new JScrollPane(table);
		scroll.setPreferredSize(new Dimension(320, 130));

		JPanel panel = new JPanel(new BorderLayout(0, 8));
		panel.add(new JLabel(summaryHtml), BorderLayout.NORTH);
		panel.add(scroll, BorderLayout.CENTER);
		JOptionPane.showMessageDialog(this, panel, title, JOptionPane.PLAIN_MESSAGE);
	}

	/** Menu: Game > High scores. The round timer is paused while the table is open. */
	private void viewHighScores() {
		roundTimer.stop();
		showScoreTable("<html><h3>High scores</h3></html>", "High scores");
		roundTimer.start();
	}

	/** Menu: Game > Log out. Forgets the "remember me" token and goes back to the login. */
	private void logout() {
		roundTimer.stop();
		remember.forget();
		new LoginGUI(); // shows the login window
		dispose(); // closes this game window
	}

	private void updateHeader() {
		StringBuilder hearts = new StringBuilder();
		for (int i = 0; i < myGame.getLives(); i++) {
			hearts.append("\u2665 "); // heart symbol
		}
		String who = (playerName == null) ? "Guest" : playerName;
		headerLabel.setText("<html>" + who + " &nbsp;|&nbsp; Level " + myGame.getLevel() + " &nbsp;|&nbsp; Score "
				+ myGame.getScore() + " &nbsp;|&nbsp; Best " + myGame.getHighScore()
				+ " &nbsp;|&nbsp; Lives <font color='#ff6b6b'>" + hearts + "</font></html>");
	}

	/**
	 * Initializes the game.
	 * 
	 * @param player
	 */
	private void initGame(String player) {
		playerName = player;
		setSize(800, 720);
		setLocationRelativeTo(null);
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setTitle("Fish Counter - how many fish are there?");

		myGame = new GameEngine(player);

		// ----- menu bar -----
		JMenuBar menuBar = new JMenuBar();
		JMenu gameMenu = new JMenu("Game");
		JMenuItem scoresItem = new JMenuItem("High scores");
		JMenuItem logoutItem = new JMenuItem("Log out");
		gameMenu.add(scoresItem);
		gameMenu.add(logoutItem);
		menuBar.add(gameMenu);
		setJMenuBar(menuBar);

		// EVENT 4: menu items
		scoresItem.addActionListener(e -> viewHighScores());
		logoutItem.addActionListener(e -> logout());

		// ----- top: header text and time bar -----
		headerLabel = new JLabel("", SwingConstants.CENTER);
		headerLabel.setFont(new Font("SansSerif", Font.BOLD, 16));
		headerLabel.setOpaque(true);
		headerLabel.setBackground(Theme.NAVY);
		headerLabel.setForeground(Color.WHITE);
		headerLabel.setBorder(new EmptyBorder(6, 10, 6, 10));

		timeBar = new TimeBar();

		JPanel top = new JPanel(new BorderLayout(0, 6));
		top.setOpaque(false);
		top.add(headerLabel, BorderLayout.NORTH);
		top.add(timeBar, BorderLayout.SOUTH);

		// ----- centre: the fish image -----
		questArea = new JLabel("", SwingConstants.CENTER);
		JScrollPane questPane = new JScrollPane(questArea);
		questPane.setBorder(BorderFactory.createLineBorder(Theme.NAVY, 4));

		// ----- bottom: feedback text and answer buttons -----
		feedbackLabel = new JLabel("Count the FISH only (not the treasure)!", SwingConstants.CENTER);
		feedbackLabel.setFont(new Font("SansSerif", Font.BOLD, 15));
		feedbackLabel.setOpaque(true);
		feedbackLabel.setBackground(new Color(255, 255, 235));
		feedbackLabel.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(Theme.NAVY, 2),
				new EmptyBorder(4, 10, 4, 10)));

		JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 8, 6));
		buttonPanel.setOpaque(false);
		for (int i = 0; i < 10; i++) {
			JButton btn = new JButton(String.valueOf(i));
			Theme.styleButton(btn, 18);
			btn.setPreferredSize(new Dimension(58, 44));
			btn.addActionListener(this);
			buttons[i] = btn;
			buttonPanel.add(btn);
		}

		JPanel bottom = new JPanel(new BorderLayout(0, 4));
		bottom.setOpaque(false);
		bottom.add(feedbackLabel, BorderLayout.NORTH);
		bottom.add(buttonPanel, BorderLayout.SOUTH);

		// ----- put it all together on the animated underwater background -----
		WaterPanel root = new WaterPanel();
		root.setLayout(new BorderLayout(10, 10));
		root.setBorder(new EmptyBorder(10, 10, 10, 10));
		root.add(top, BorderLayout.NORTH);
		root.add(questPane, BorderLayout.CENTER);
		root.add(bottom, BorderLayout.SOUTH);
		getContentPane().add(root);

		// EVENT 3: keyboard shortcuts - pressing 0-9 clicks the matching button.
		for (int i = 0; i < 10; i++) {
			final int digit = i;
			Action pressDigit = new AbstractAction() {
				private static final long serialVersionUID = 1L;

				@Override
				public void actionPerformed(ActionEvent e) {
					buttons[digit].doClick();
				}
			};
			String name = "digit" + digit;
			JComponent rp = getRootPane();
			rp.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(KeyStroke.getKeyStroke(KeyEvent.VK_0 + digit, 0),
					name);
			rp.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW)
					.put(KeyStroke.getKeyStroke(KeyEvent.VK_NUMPAD0 + digit, 0), name);
			rp.getActionMap().put(name, pressDigit);
		}

		// The round timer: calls onTimerTick() every TICK_MS milliseconds.
		roundTimer = new Timer(TICK_MS, new ActionListener() {
			@Override
			public void actionPerformed(ActionEvent e) {
				onTimerTick();
			}
		});

		showNewImage();
		updateHeader();
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