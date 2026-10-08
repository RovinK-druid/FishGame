package com.perisic.fish.peripherals;
/*
 * Based on the unit example by Marc Conrad, which was adapted from
 * https://best-programming-tricks.blogspot.com/2011/07/how-to-make-login-form-with-java-gui.html
 */

import java.awt.FlowLayout;
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

		JPanel panel = new JPanel(new GridBagLayout());
		panel.setBorder(BorderFactory.createEmptyBorder(20, 30, 20, 30));
		GridBagConstraints gc = new GridBagConstraints();
		gc.insets = new Insets(5, 5, 5, 5);
		gc.fill = GridBagConstraints.HORIZONTAL;

		JLabel title = new JLabel("FISH COUNTER", SwingConstants.CENTER);
		gc.gridx = 0;
		gc.gridy = 0;
		gc.gridwidth = 2;
		panel.add(title, gc);

		gc.gridwidth = 1;
		gc.gridy = 1;
		gc.gridx = 0;
		panel.add(new JLabel("Username"), gc);
		gc.gridx = 1;
		panel.add(txuser, gc);

		gc.gridy = 2;
		gc.gridx = 0;
		panel.add(new JLabel("Password"), gc);
		gc.gridx = 1;
		panel.add(pass, gc);

		gc.gridy = 3;
		gc.gridx = 0;
		gc.gridwidth = 2;
		panel.add(bremember, gc);

		JPanel buttons = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
		buttons.add(blogin);
		buttons.add(bcreate);
		gc.gridy = 4;
		panel.add(buttons, gc);

		getContentPane().add(panel);
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