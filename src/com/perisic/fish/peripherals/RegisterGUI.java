package com.perisic.fish.peripherals;

import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import javax.swing.SwingConstants;

/**
 * Window where a new player creates an account.
 * It only handles display and button events; the checking and saving is done by UserStore
 * (through LoginData).
 */
public class RegisterGUI extends JDialog {

	private static final long serialVersionUID = 4821937461827364L;

	JTextField txuser = new JTextField(15);
	JPasswordField pass = new JPasswordField(15);
	JPasswordField confirm = new JPasswordField(15);
	JButton bregister = new JButton("Register");
	JButton bback = new JButton("Back to login");

	RegisterGUI(JFrame owner, LoginData ldata) {
		super(owner, "Fish Counter - Create account", true); // true = blocks the login window

		WaterPanel root = new WaterPanel();
		root.setLayout(new GridBagLayout());
		root.setPreferredSize(new Dimension(480, 460));

		JPanel card = new JPanel(new GridBagLayout());
		card.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(Theme.NAVY, 3),
				BorderFactory.createEmptyBorder(20, 30, 20, 30)));
		GridBagConstraints gc = new GridBagConstraints();
		gc.insets = new Insets(5, 5, 5, 5);
		gc.fill = GridBagConstraints.HORIZONTAL;

		JLabel title = new JLabel("NEW PLAYER", SwingConstants.CENTER);
		title.setFont(new Font("SansSerif", Font.BOLD, 24));
		title.setForeground(Theme.NAVY);
		gc.gridx = 0;
		gc.gridy = 0;
		gc.gridwidth = 2;
		card.add(title, gc);

		gc.gridwidth = 1;
		gc.gridy = 1;
		gc.gridx = 0;
		card.add(new JLabel("Username"), gc);
		gc.gridx = 1;
		card.add(txuser, gc);

		gc.gridy = 2;
		gc.gridx = 0;
		card.add(new JLabel("Password"), gc);
		gc.gridx = 1;
		card.add(pass, gc);

		gc.gridy = 3;
		gc.gridx = 0;
		card.add(new JLabel("Repeat password"), gc);
		gc.gridx = 1;
		card.add(confirm, gc);

		JLabel note = new JLabel("<html><small>Username: 3-20 letters, numbers or _.<br>"
				+ "Password: at least 8 characters.<br>"
				+ "Only a hash of your password is saved.</small></html>");
		gc.gridy = 4;
		gc.gridx = 0;
		gc.gridwidth = 2;
		card.add(note, gc);

		Theme.styleButton(bregister, 14);
		Theme.styleButton(bback, 12);
		JPanel buttons = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
		buttons.setOpaque(false);
		buttons.add(bregister);
		buttons.add(bback);
		gc.gridy = 5;
		card.add(buttons, gc);

		root.add(card);

		// EVENT: Register button
		bregister.addActionListener(e -> {
			String error = ldata.register(txuser.getText().trim(), String.valueOf(pass.getPassword()),
					String.valueOf(confirm.getPassword()));
			if (error == null) {
				JOptionPane.showMessageDialog(this, "Account created! You can now log in.");
				dispose();
			} else {
				JOptionPane.showMessageDialog(this, error, "Could not register", JOptionPane.WARNING_MESSAGE);
			}
		});

		// EVENT: Back button
		bback.addActionListener(e -> dispose());

		getRootPane().setDefaultButton(bregister); // pressing Enter clicks Register

		getContentPane().add(root);
		pack();
		setLocationRelativeTo(owner);
		setVisible(true); // blocks until the dialog is closed
	}
}