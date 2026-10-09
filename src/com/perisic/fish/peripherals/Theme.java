package com.perisic.fish.peripherals;

import java.awt.Color;
import java.awt.Cursor;
import java.awt.Font;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

import javax.swing.JButton;

/**
 * Colours and button style shared by all windows, so the game looks consistent.
 * Keeping the style in one place means a colour change only has to be made once
 * (high cohesion: this class only knows about looks).
 */
public final class Theme {

	public static final Color NAVY = new Color(0, 60, 110);
	public static final Color BUTTON = new Color(173, 216, 230);
	public static final Color BUTTON_HOVER = new Color(120, 190, 225);

	private Theme() {
		// not meant to be created
	}

	/** Gives a button the game style, including a hover colour (mouse events). */
	public static void styleButton(final JButton b, int fontSize) {
		b.setFont(new Font("SansSerif", Font.BOLD, fontSize));
		b.setBackground(BUTTON);
		b.setForeground(NAVY);
		b.setFocusPainted(false);
		b.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
		b.addMouseListener(new MouseAdapter() {
			@Override
			public void mouseEntered(MouseEvent e) {
				b.setBackground(BUTTON_HOVER);
			}

			@Override
			public void mouseExited(MouseEvent e) {
				b.setBackground(BUTTON);
			}
		});
	}
}