package com.perisic.fish.peripherals;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;
import java.awt.image.BufferedImage;

import javax.swing.AbstractAction;
import javax.swing.BorderFactory;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.KeyStroke;
import javax.swing.SwingConstants;
import javax.swing.border.EmptyBorder;

import com.perisic.fish.engine.AdventureEngine;

/**
 * The checkpoint puzzle: a fish picture from the Fish Game API and the buttons 0-9.
 * Use PuzzleDialog.ask(...) - it returns true if the player solved it.
 */
public class PuzzleDialog extends JDialog {

	private static final long serialVersionUID = 3344556677889900L;

	private boolean solved = false;
	private final JLabel feedback = new JLabel("Count the FISH only to open the gate!", SwingConstants.CENTER);

	/** Shows the puzzle and waits until it is solved or closed. */
	public static boolean ask(JFrame owner, AdventureEngine engine) {
		BufferedImage image = engine.loadPuzzle(); // this calls the Fish Game API
		if (image == null) {
			JOptionPane.showMessageDialog(owner,
					"Could not reach the Fish server.\nCheck your internet connection and try again.",
					"Connection problem", JOptionPane.WARNING_MESSAGE);
			return false;
		}
		PuzzleDialog dialog = new PuzzleDialog(owner, engine, image);
		dialog.setVisible(true); // blocks until the dialog is closed
		return dialog.solved;
	}

	private PuzzleDialog(JFrame owner, AdventureEngine engine, BufferedImage image) {
		super(owner, "Checkpoint - count the fish!", true);

		WaterPanel root = new WaterPanel();
		root.setLayout(new BorderLayout(8, 8));
		root.setBorder(new EmptyBorder(10, 10, 10, 10));

		feedback.setFont(new Font("SansSerif", Font.BOLD, 15));
		feedback.setOpaque(true);
		feedback.setBackground(new Color(255, 255, 235));
		feedback.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(Theme.NAVY, 2),
				new EmptyBorder(4, 10, 4, 10)));

		JScrollPane picture = new JScrollPane(new JLabel(new ImageIcon(image)));
		picture.setBorder(BorderFactory.createLineBorder(Theme.NAVY, 4));
		picture.setPreferredSize(new Dimension(Math.min(image.getWidth() + 8, 760), Math.min(image.getHeight() + 8, 470)));

		JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 8, 6));
		buttonPanel.setOpaque(false);
		JButton[] buttons = new JButton[10];
		for (int i = 0; i < 10; i++) {
			final int guess = i;
			JButton btn = new JButton(String.valueOf(i));
			Theme.styleButton(btn, 18);
			btn.setPreferredSize(new Dimension(58, 44));
			// EVENT: an answer button was pressed
			btn.addActionListener(e -> {
				if (engine.checkPuzzle(guess)) {
					solved = true;
					dispose();
				} else {
					feedback.setText("Not quite - try again!");
					feedback.setForeground(Color.RED);
				}
			});
			buttons[i] = btn;
			buttonPanel.add(btn);
		}

		// EVENT: keys 0-9 press the matching button
		for (int i = 0; i < 10; i++) {
			final int digit = i;
			String name = "digit" + digit;
			JComponent rp = getRootPane();
			rp.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(KeyStroke.getKeyStroke(KeyEvent.VK_0 + digit, 0),
					name);
			rp.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW)
					.put(KeyStroke.getKeyStroke(KeyEvent.VK_NUMPAD0 + digit, 0), name);
			rp.getActionMap().put(name, new AbstractAction() {
				private static final long serialVersionUID = 1L;

				@Override
				public void actionPerformed(ActionEvent e) {
					buttons[digit].doClick();
				}
			});
		}

		root.add(feedback, BorderLayout.NORTH);
		root.add(picture, BorderLayout.CENTER);
		root.add(buttonPanel, BorderLayout.SOUTH);
		getContentPane().add(root);
		pack();
		setLocationRelativeTo(owner);
	}
}