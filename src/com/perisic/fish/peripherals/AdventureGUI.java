package com.perisic.fish.peripherals;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Font;
import java.awt.GridBagLayout;
import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;

import javax.swing.AbstractAction;
import javax.swing.BorderFactory;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.KeyStroke;
import javax.swing.SwingConstants;
import javax.swing.border.EmptyBorder;

import com.perisic.fish.engine.AdventureEngine;
import com.perisic.fish.engine.RememberMe;

/**
 * The adventure window: swim around the map with the arrow keys (or W A S D).
 * Gates ask a fish-counting puzzle from the Fish Game API; reach the treasure chest to win.
 * This class handles the window and the key EVENTS; the rules are in AdventureEngine.
 */
public class AdventureGUI extends JFrame {

	private static final long serialVersionUID = 6677889900112233L;

	private final AdventureEngine engine = new AdventureEngine();
	private final String playerName;

	private final MapPanel map = new MapPanel(engine);
	private final JLabel headerLabel = new JLabel("", SwingConstants.CENTER);
	private final JLabel hintLabel = new JLabel("", SwingConstants.CENTER);

	public AdventureGUI(String player) {
		super("Fish Counter - Adventure");
		playerName = player;

		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setResizable(false);

		// ----- menu bar -----
		JMenuBar menuBar = new JMenuBar();
		JMenu gameMenu = new JMenu("Game");
		JMenuItem arcadeItem = new JMenuItem("Arcade mode");
		JMenuItem restartItem = new JMenuItem("Restart adventure");
		JMenuItem logoutItem = new JMenuItem("Log out");
		gameMenu.add(arcadeItem);
		gameMenu.add(restartItem);
		gameMenu.add(logoutItem);
		menuBar.add(gameMenu);
		setJMenuBar(menuBar);

		// EVENT: menu items
		arcadeItem.addActionListener(e -> {
			new GameGUI(playerName).setVisible(true);
			dispose();
		});
		restartItem.addActionListener(e -> {
			engine.restart();
			setHint("Adventure restarted.");
			refresh();
		});
		logoutItem.addActionListener(e -> {
			new RememberMe().forget();
			new LoginGUI();
			dispose();
		});

		// ----- header and hint -----
		headerLabel.setFont(new Font("SansSerif", Font.BOLD, 16));
		headerLabel.setOpaque(true);
		headerLabel.setBackground(Theme.NAVY);
		headerLabel.setForeground(Color.WHITE);
		headerLabel.setBorder(new EmptyBorder(6, 10, 6, 10));

		hintLabel.setFont(new Font("SansSerif", Font.BOLD, 14));
		hintLabel.setOpaque(true);
		hintLabel.setBackground(new Color(255, 255, 235));
		hintLabel.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(Theme.NAVY, 2),
				new EmptyBorder(4, 10, 4, 10)));

		// the map sits in the middle of the water background
		map.setBorder(BorderFactory.createLineBorder(Theme.NAVY, 4));
		JPanel mapHolder = new JPanel(new GridBagLayout());
		mapHolder.setOpaque(false);
		mapHolder.add(map);

		WaterPanel root = new WaterPanel();
		root.setLayout(new BorderLayout(10, 10));
		root.setBorder(new EmptyBorder(10, 10, 10, 10));
		root.add(headerLabel, BorderLayout.NORTH);
		root.add(mapHolder, BorderLayout.CENTER);
		root.add(hintLabel, BorderLayout.SOUTH);
		getContentPane().add(root);

		// EVENT: arrow keys and W A S D move the fish
		bindKey(KeyEvent.VK_LEFT, "left", -1, 0);
		bindKey(KeyEvent.VK_RIGHT, "right", 1, 0);
		bindKey(KeyEvent.VK_UP, "up", 0, -1);
		bindKey(KeyEvent.VK_DOWN, "down", 0, 1);
		bindKey(KeyEvent.VK_A, "a", -1, 0);
		bindKey(KeyEvent.VK_D, "d", 1, 0);
		bindKey(KeyEvent.VK_W, "w", 0, -1);
		bindKey(KeyEvent.VK_S, "s", 0, 1);

		setHint("Swim with the arrow keys or W A S D. Reach the treasure chest!");
		refresh();
		pack();
		setLocationRelativeTo(null);
	}

	/** Connects a key to a move. */
	private void bindKey(int keyCode, String name, final int dx, final int dy) {
		JComponent rp = getRootPane();
		rp.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(KeyStroke.getKeyStroke(keyCode, 0), name);
		rp.getActionMap().put(name, new AbstractAction() {
			private static final long serialVersionUID = 1L;

			@Override
			public void actionPerformed(ActionEvent e) {
				tryMove(dx, dy);
			}
		});
	}

	private void tryMove(int dx, int dy) {
		switch (engine.move(dx, dy)) {
		case CHECKPOINT: {
			boolean solved = PuzzleDialog.ask(this, engine);
			setHint(solved ? "The gate opened! Swim through." : "The gate is still closed.");
			break;
		}
		case EXIT:
			levelComplete();
			break;
		case MOVED:
			setHint(" ");
			break;
		default: // BLOCKED: nothing happens
			break;
		}
		refresh();
	}

	private void levelComplete() {
		int levelScore = engine.completeLevel();
		JOptionPane.showMessageDialog(this,
				"<html><h3>Level " + engine.getLevelNumber() + " complete!</h3>Steps: " + engine.getSteps()
						+ "<br>Mistakes: " + engine.getMistakes() + "<br>Level score: " + levelScore
						+ "<br>Total score: " + engine.getTotalScore() + "</html>",
				"Treasure found!", JOptionPane.PLAIN_MESSAGE);
		if (engine.hasNextLevel()) {
			engine.nextLevel();
			setHint("Next level - good luck!");
		} else {
			JOptionPane.showMessageDialog(this, "You finished every level!\nFinal score: " + engine.getTotalScore());
			engine.restart();
			setHint("Starting again from level 1.");
		}
	}

	private void setHint(String text) {
		hintLabel.setText(text);
	}

	/** Updates the header text and redraws the map. */
	private void refresh() {
		String who = (playerName == null) ? "Guest" : playerName;
		headerLabel.setText(who + "  |  Level " + engine.getLevelNumber() + ": " + engine.getLevel().getName()
				+ "  |  Steps " + engine.getSteps() + "  |  Gates opened " + engine.getGatesOpened()
				+ "  |  Mistakes " + engine.getMistakes() + "  |  Score " + engine.getTotalScore());
		map.repaint();
	}

	/** Can be run directly for testing without the login. */
	public static void main(String[] args) {
		new AdventureGUI(null).setVisible(true);
	}
}