package com.perisic.fish.peripherals;
/*
 * Based on the unit example by Marc Conrad, which was adapted from
 * https://best-programming-tricks.blogspot.com/2011/07/how-to-make-login-form-with-java-gui.html
 * Layout, "Create account" button, Enter key handling, "Remember me" and the underwater look
 */

import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import javax.swing.SwingConstants;

import com.perisic.fish.engine.RememberMe;

public class LoginGUI extends JFrame {

	private static final long serialVersionUID = -6921462126880570161L;

	public static void main(String[] args) {
		new LoginGUI();
	}

	JButton blogin = new JButton("Login");
	JButton bcreate = new JButton("Create account");
	JTextField txuser = new JTextField(15);
	JPasswordField pass = new JPasswordField(15);
	JCheckBox bremember = new JCheckBox("Remember me on this computer");

	LoginData ldata = new LoginData();
	RememberMe remember = new RememberMe();

	LoginGUI() {
		super("Fish Counter - Login");

		// REMEMBER ME: if a valid token is saved on this computer, skip the login window.
		String remembered = remember.load();
		if (remembered != null) {
			new GameGUI(remembered).setVisible(true);
			dispose();
			return;
		}

		// the underwater background with a white "card" in the middle
		WaterPanel root = new WaterPanel();
		root.setLayout(new GridBagLayout());
		root.setPreferredSize(new Dimension(460, 400));

		JPanel card = new JPanel(new GridBagLayout());
		card.setBorder(BorderFactory.createCompoundBorder(BorderFactory.createLineBorder(Theme.NAVY, 3),
				BorderFactory.createEmptyBorder(20, 30, 20, 30)));
		GridBagConstraints gc = new GridBagConstraints();
		gc.insets = new Insets(5, 5, 5, 5);
		gc.fill = GridBagConstraints.HORIZONTAL;

		JLabel title = new JLabel("FISH COUNTER", SwingConstants.CENTER);
		title.setFont(new Font("SansSerif", Font.BOLD, 26));
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

		bremember.setOpaque(false);
		gc.gridy = 3;
		gc.gridx = 0;
		gc.gridwidth = 2;
		card.add(bremember, gc);

		Theme.styleButton(blogin, 14);
		Theme.styleButton(bcreate, 12);
		JPanel buttons = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
		buttons.setOpaque(false);
		buttons.add(blogin);
		buttons.add(bcreate);
		gc.gridy = 4;
		card.add(buttons, gc);

		root.add(card);
		getContentPane().add(root);
		getRootPane().setDefaultButton(blogin); // pressing Enter clicks Login
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		pack();
		setLocationRelativeTo(null);
		setVisible(true);
		actionlogin();
	}

	public void actionlogin() {
		// EVENT: Login button (or the Enter key)
		blogin.addActionListener(e -> {
			String puname = txuser.getText().trim();
			String ppaswd = String.valueOf(pass.getPassword()); // https://stackoverflow.com/questions/10443308/why-gettext-in-jpasswordfield-was-deprecated
			if (ldata.checkPassword(puname, ppaswd)) {
				if (bremember.isSelected()) {
					remember.issue(puname); // save a token so next start skips the login
				} else {
					remember.forget(); // make sure no old token is left behind
				}
				GameGUI theGame = new GameGUI(puname);
				theGame.setVisible(true);
				dispose();
			} else {
				JOptionPane.showMessageDialog(this, "Wrong Password / Username");
				txuser.setText("");
				pass.setText("");
				txuser.requestFocus();
			}
		});

		// EVENT: Create account button opens the registration window
		bcreate.addActionListener(e -> new RegisterGUI(this, ldata));
	}
}