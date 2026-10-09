package com.perisic.fish.peripherals;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import javax.swing.JPanel;
import javax.swing.Timer;

/**
 * An animated underwater background: a blue gradient, rising bubbles, swaying seaweed and sand.
 * Other panels are placed on top of it. The animation is driven by a Swing Timer
 * (another event source: it fires every 40 ms).
 */
public class WaterPanel extends JPanel {

	private static final long serialVersionUID = 7712340192837465L;

	/** One bubble. x and y are fractions of the panel size (0 = left/top, 1 = right/bottom). */
	private static class Bubble {
		float x;
		float y;
		float radius; // in pixels
		float speed; // fraction of the height per tick
		float wobble; // makes the bubbles sway differently
	}

	private final List<Bubble> bubbles = new ArrayList<Bubble>();
	private final Random random = new Random();
	private final Timer timer;
	private float phase = 0;

	public WaterPanel() {
		for (int i = 0; i < 28; i++) {
			Bubble b = new Bubble();
			resetBubble(b, true);
			bubbles.add(b);
		}
		timer = new Timer(40, e -> {
			step();
			repaint();
		});
	}

	private void resetBubble(Bubble b, boolean anywhere) {
		b.x = random.nextFloat();
		b.y = anywhere ? random.nextFloat() : 1.05f; // start at the bottom after the first time
		b.radius = 3 + random.nextFloat() * 8;
		b.speed = 0.002f + random.nextFloat() * 0.004f;
		b.wobble = random.nextFloat() * 6f;
	}

	/** Moves every bubble up a little. */
	private void step() {
		phase += 0.05f;
		for (Bubble b : bubbles) {
			b.y -= b.speed;
			if (b.y < -0.05f) {
				resetBubble(b, false);
			}
		}
	}

	// The animation only runs while the panel is actually in a window.
	@Override
	public void addNotify() {
		super.addNotify();
		timer.start();
	}

	@Override
	public void removeNotify() {
		timer.stop();
		super.removeNotify();
	}

	@Override
	protected void paintComponent(Graphics g) {
		super.paintComponent(g);
		Graphics2D g2 = (Graphics2D) g.create();
		g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		int w = getWidth();
		int h = getHeight();

		// water: light at the top, deep blue at the bottom
		g2.setPaint(new GradientPaint(0, 0, new Color(135, 206, 235), 0, h, new Color(0, 70, 130)));
		g2.fillRect(0, 0, w, h);

		// sand
		g2.setColor(new Color(214, 190, 130));
		g2.fillRect(0, h - 14, w, 14);

		// seaweed swaying with the phase
		g2.setStroke(new BasicStroke(6f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
		g2.setColor(new Color(34, 139, 84));
		for (int i = 0; i < 8; i++) {
			int baseX = (int) (w * (i + 0.5) / 8.0);
			int baseY = h - 12;
			int prevX = baseX;
			int prevY = baseY;
			for (int s = 1; s <= 6; s++) {
				int nx = baseX + (int) (Math.sin(phase * 1.5 + i + s * 0.7) * (4 + s * 2));
				int ny = baseY - s * 12;
				g2.drawLine(prevX, prevY, nx, ny);
				prevX = nx;
				prevY = ny;
			}
		}

		// bubbles
		g2.setStroke(new BasicStroke(1.5f));
		for (Bubble b : bubbles) {
			int px = (int) (b.x * w + Math.sin(phase + b.wobble) * 6);
			int py = (int) (b.y * h);
			int d = (int) (b.radius * 2);
			g2.setColor(new Color(255, 255, 255, 70));
			g2.fillOval(px, py, d, d);
			g2.setColor(new Color(255, 255, 255, 170));
			g2.drawOval(px, py, d, d);
		}
		g2.dispose();
	}
}