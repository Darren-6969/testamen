// src/controllers/authMobileController.js
const { getConnection , runQuery} = require('../db/connectionManager');
const { hashPassword, comparePassword } = require('../utils/hashUtils');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// ✅ Cookie options helper (avoid cross-site + localhost issues)
function getCookieOptions(req, { maxAgeMs } = {}) {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    // If your frontend is on a DIFFERENT origin/IP, you usually need SameSite=None + Secure (HTTPS only)
    // For local HTTP dev, you cannot use Secure=true.
    secure: isProd,                 // ✅ true only in production HTTPS
    sameSite: isProd ? "Strict" : "Lax",
    path: "/",
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
}


const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '60m'
    });
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d'
    });
};


const register = async (req, res) => {
    const db = getConnection('mysql');
    const { username, password, email,name,role } = req.body;

    try {
        const hashed = await hashPassword(password);
        await db.query('INSERT INTO users (username, password, email, name, role_id) VALUES (?, ?, ?,?,?)', [username, hashed, email, name, role]);
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed' });
    }
};

const login = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { username, password } = req.body;

  try {
    let rows = await runQuery(db, "SELECT * FROM users WHERE username = $1", [username]);

    if (!rows.length) {
      rows = await runQuery(db, "SELECT * FROM users WHERE email = $1", [username]);
      if (!rows.length) return res.status(401).json({ message: "User not found" });
    }

    const user = rows[0];

    // MOBILE ONLY: must be customer
    if (Number(user.status_id) == 1) {
      return res.status(403).json({
        message: "Invalid user account.",
      });
    }

    if (user.acc_status !== "Active" && user.acc_status !== "Barred") {
      return res.status(403).json({
        message: "Your account is not active. Please contact the administrator.",
      });
    }

    const match = await comparePassword(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid username or incorrect." });

    await runQuery(db, "UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const payload = { userId: user.id, username: user.username };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const cookieOpts = getCookieOptions();

    // ✅ set HttpOnly cookies (unique to customer)
    res.cookie("token", accessToken, {
      ...cookieOpts,
      maxAge: 1000 * 60 * 60, // 60 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOpts,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return res.json({
      // optional: still return for mobile native apps
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status_id: user.status_id,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
};


const forgotPassword = async (req, res) => {
  const { email } = req.body; // still accept this for UI consistency
  const db = getConnection(process.env.DB_TYPE);

  try {
    console.log(`Forgot password requested for email: ${email}`);
    // Step 1: find user (optional, for real environment)
    const users = await runQuery(db, 'SELECT * FROM users WHERE email = $1', [email]);
    const user = users[0];

    if (!user) {
      // For security, do not reveal if email exists
      console.log(`Email not found: ${email}`);
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    // Step 2: create a reset token (15 min expiry)
    const token = jwt.sign(
      { userId: user?.id || 0, email }, // still attach email for traceability
      process.env.JWT_SECRET,
      { expiresIn: '60m' }
    );

    // insert token into password_resets table
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
    await runQuery(db, 'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, token, expiresAt]);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Step 3: fixed recipient setup
    const fixedRecipient = 'nfatinajihah07@gmail.com';
    // const fixedRecipient = user.email; // for real environment

    // Step 4: email transport (Nodemailer)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Step 5: send reset link to the fixed email
    await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_USER}>`,
      to: fixedRecipient, // 👈 fixed address here
      subject: 'Password Reset Request (Test Mode)',
      html: `
        <p>A password reset was requested for: <b>${email}</b></p>
        <p>Click below to reset:</p>
        <a href="${resetLink}"><b>Reset Password Link</b></a>
        <p>Please reset your password within 15 minutes.</p>
        <p><i>This email was sent to a fixed test address (${fixedRecipient}) for development purposes.</i></p>
      `,
    });

    res.json({ message: 'Password reset link sent (test mode).' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Error sending reset link.' });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const db = getConnection(process.env.DB_TYPE);
    try {
        const result = await runQuery(db, 'SELECT * FROM password_resets WHERE used = false AND token = $1 AND expires_at > NOW()', [token]);
        if (result.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        }
        // Mark the token as used
        await runQuery(db, 'UPDATE password_resets SET used = true, used_at = NOW() WHERE token = $1', [token]);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hashed = await hashPassword(password);
        await runQuery(db, 'UPDATE users SET password = $1 WHERE id = $2', [hashed, decoded.userId]);
        res.json({ message: 'Password has been reset' });
    } catch (err) {
        console.error(err);
        // 🕓 Handle expired or invalid token
        if (err.name === 'TokenExpiredError') {
          return res
            .status(401)
            .json({ success: false, message: 'Your reset link has expired. Please request a new one.' });
        }

        if (err.name === 'JsonWebTokenError') {
          return res
            .status(400)
            .json({ success: false, message: 'Invalid or corrupted reset token.' });
        }

        // 🔴 Generic catch-all
        res.status(500).json({ success: false, message: 'Password reset failed.' });
    }
};

const changePassword = async (req, res) => {
    const db = getConnection('mysql');
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (!rows.length) return res.status(404).json({ message: 'User not found' });

        const user = rows[0];
        const match = await comparePassword(currentPassword, user.password);
        if (!match) return res.status(401).json({ message: 'Current password incorrect' });

        const hashed = await hashPassword(newPassword);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Password change failed' });
    }
};

// Refresh Token
// const refreshToken = async (req, res) => {
//   const token = req.cookies?.refreshToken;
//   if (!token) return res.status(401).json({ message: 'No refresh token' });

//   try {
//     const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
//     const accessToken = generateAccessToken(decoded);
//     res.json({ accessToken });
//   } catch (err) {
//     res.status(403).json({ message: 'Invalid or expired refresh token' });
//   }
// };

const refreshToken = async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // decoded contains userId/username + iat/exp
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      username: decoded.username,
    });

    const cookieOpts = getCookieOptions();

    // ✅ rotate access cookie
    res.cookie("token", newAccessToken, {
      ...cookieOpts,
      maxAge: 1000 * 60 * 15,
    });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};


// Logout
// const logout = async (req, res) => {
//   res.clearCookie('refreshToken', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'Strict'
//   });
//   res.clearCookie('token', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'Strict'
//   });
//   res.json({ message: 'Logged out' });
// };

const logout = async (req, res) => {
  const cookieOpts = getCookieOptions();

  // IMPORTANT: clear with same path + options
  res.clearCookie("refreshToken", cookieOpts);
  res.clearCookie("token", cookieOpts);

  // (optional) if you previously used these old names, clear them too:
  res.clearCookie("refreshToken", cookieOpts);
  res.clearCookie("token", cookieOpts);
  res.clearCookie("access_token", { path: "/" });

  return res.json({ message: "Logged out" });
};


module.exports = { login, refreshToken, logout, register, changePassword, forgotPassword, resetPassword };

