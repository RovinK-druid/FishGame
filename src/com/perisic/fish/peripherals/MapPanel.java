package com.perisic.fish.peripherals;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.JPanel;

import com.perisic.fish.engine.AdventureEngine;
import com.perisic.fish.engine.Level;

/**
 * Draws the current level: water, rocks, gates, the treasure chest and the player's fish.
 * It only DRAWS what the engine says; it contains no game rules.
 */
public class MapPanel extends JPanel {

	private static final long serialVersionUID = 9081726354019283L;

	private static final int TILE = 48; // size of one square in pixels

	private final AdventureEngine engine;

	public MapPanel(AdventureEngine engine) {
		this.engine = engine;
		Level lv = engine.getLevel();
		setPreferredSize(new Dimension(lv.getWidth() * TILE, lv.getHeight() * TILE));
	}

	@Override
	protected void paintComponent(Graphics g) {
		super.paintComponent(g);
		Graphics2D g2 = (Graphics2D) g.create();
		g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

		Level lv = engine.getLevel();
		for (int y = 0; y < lv.getHeight(); y++) {
			for (int x = 0; x < lv.getWidth(); x++) {
				int px = x * TILE;
				int py = y * TILE;

				// water, with a slightly different shade on every other square
				g2.setColor(((x + y) % 2 == 0) ? new Color(135, 206, 235) : new Color(125, 198, 230));
				g2.fillRect(px, py, TILE, TILE);

				char tile = lv.getTile(x, y);
				if (tile == Level.ROCK) {
					drawRock(g2, px, py);
				} else if (tile == Level.GATE) {
					drawGate(g2, px, py);
				} else if (tile == Level.EXIT) {
					drawChest(g2, px, py);
				}
			}
		}
		drawPlayer(g2, engine.getPlayerX() * TILE, engine.getPlayerY() * TILE);
		g2.dispose();
	}

	private void drawRock(Graphics2D g2, int px, int py) {
		g2.setColor(new Color(105, 105, 115));
		g2.fillRoundRect(px + 2, py + 2, TILE - 4, TILE - 4, 14, 14);
		g2.setColor(new Color(150, 150, 160));
		g2.fillRoundRect(px + 8, py + 8, TILE / 2, TILE / 3, 10, 10);
		g2.setColor(new Color(60, 60, 70));
		g2.drawRoundRect(px + 2, py + 2, TILE - 4, TILE - 4, 14, 14);
	}

	private void drawGate(Graphics2D g2, int px, int py) {
		g2.setColor(new Color(139, 90, 43));
		g2.fillRect(px + 6, py + 2, TILE - 12, TILE - 4);
		g2.setColor(new Color(240, 200, 60));
		for (int i = 0; i < 3; i++) {
			g2.fillRect(px + 12 + i * 10, py + 4, 4, TILE - 8);
		}
		g2.setColor(Color.WHITE);
		g2.fillOval(px + TILE / 2 - 11, py + TILE / 2 - 11, 22, 22);
		g2.setColor(Theme.NAVY);
		g2.setFont(new Font("SansSerif", Font.BOLD, 18));
		g2.drawString("?", px + TILE / 2 - 5, py + TILE / 2 + 6);
	}

	private void drawChest(Graphics2D g2, int px, int py) {
		g2.setColor(new Color(190, 130, 70));
		g2.fillRect(px + 8, py + 20, TILE - 16, TILE - 28);
		g2.setColor(new Color(150, 95, 45));
		g2.fillRoundRect(px + 8, py + 10, TILE - 16, 16, 10, 10);
		g2.setColor(new Color(240, 200, 60));
		g2.fillRect(px + TILE / 2 - 4, py + 22, 8, 10);
		g2.setColor(new Color(90, 55, 25));
		g2.drawRect(px + 8, py + 20, TILE - 16, TILE - 28);
	}

	private void drawPlayer(Graphics2D g2, int px, int py) {
		int fx = px + 6;
		int fy = py + 14;
		g2.setColor(new Color(255, 140, 0)); // orange, so it stands out from the water
		g2.fillOval(fx, fy, 28, 20);
		g2.fillPolygon(new int[] { fx + 24, fx + 38, fx + 38 }, new int[] { fy + 10, fy + 1, fy + 19 }, 3);
		g2.setColor(Color.WHITE);
		g2.fillOval(fx + 6, fy + 5, 7, 7);
		g2.setColor(Color.BLACK);
		g2.fillOval(fx + 8, fy + 7, 3, 3);
	}
}