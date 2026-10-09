package com.perisic.fish.peripherals;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.JComponent;

/**
 * The round timer bar, drawn by hand so its colour can change (green to red) and it can show
 * the seconds left. It is used like a JProgressBar: setMaximum, setValue, setForeground.
 * Values are in milliseconds.
 */
public class TimeBar extends JComponent {

	private static final long serialVersionUID = 5543210987654321L;

	private int value = 100;
	private int maximum = 100;

	public TimeBar() {
		setForeground(new Color(0, 170, 0));
		setPreferredSize(new Dimension(700, 24));
	}

	public int getMaximum() {
		return maximum;
	}

	public void setMaximum(int max) {
		maximum = Math.max(1, max);
		repaint();
	}

	public void setValue(int v) {
		value = Math.max(0, Math.min(v, maximum));
		repaint();
	}

	@Override
	protected void paintComponent(Graphics g) {
		Graphics2D g2 = (Graphics2D) g.create();
		g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		int w = getWidth();
		int h = getHeight();

		// dark track
		g2.setColor(new Color(0, 40, 80));
		g2.fillRoundRect(0, 0, w, h, h, h);

		// coloured part
		int fill = (int) ((long) (w - 4) * value / maximum);
		fill = Math.max(0, Math.min(fill, w - 4));
		if (fill > 0) {
			g2.setColor(getForeground());
			g2.fillRoundRect(2, 2, fill, h - 4, h - 4, h - 4);
		}

		// outline and seconds left
		g2.setColor(Color.WHITE);
		g2.drawRoundRect(0, 0, w - 1, h - 1, h, h);
		String text = ((value + 999) / 1000) + "s";
		g2.setFont(new Font("SansSerif", Font.BOLD, 13));
		FontMetrics fm = g2.getFontMetrics();
		g2.drawString(text, (w - fm.stringWidth(text)) / 2, (h + fm.getAscent() - fm.getDescent()) / 2);
		g2.dispose();
	}
}