const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword, comparePassword } = require('../utils/hashUtils');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const DEFAULT_ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '60m';
const DEFAULT_REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
const REMEMBER_ME_ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_REMEMBER_EXPIRY || '30d';
const REMEMBER_ME_REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_REMEMBER_EXPIRY || '30d';
const REMEMBER_ME_COOKIE_MAX_AGE_MS = Number(process.env.REMEMBER_ME_COOKIE_MAX_AGE_MS || 30 * 24 * 60 * 60 * 1000);

const generateAccessToken = (payload, expiresIn = DEFAULT_ACCESS_TOKEN_EXPIRY) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (payload, expiresIn = DEFAULT_REFRESH_TOKEN_EXPIRY) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn });
};

function normalizeRememberMe(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function getCookieOptions({ maxAgeMs } = {}) {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'Strict' : 'Lax',
    path: '/',
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
}

function getLoginSessionConfig(rememberMe) {
  if (rememberMe) {
    return {
      rememberMe: true,
      accessTokenExpiry: REMEMBER_ME_ACCESS_TOKEN_EXPIRY,
      refreshTokenExpiry: REMEMBER_ME_REFRESH_TOKEN_EXPIRY,
      accessCookieMaxAgeMs: REMEMBER_ME_COOKIE_MAX_AGE_MS,
      refreshCookieMaxAgeMs: REMEMBER_ME_COOKIE_MAX_AGE_MS,
    };
  }

  return {
    rememberMe: false,
    accessTokenExpiry: DEFAULT_ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: DEFAULT_REFRESH_TOKEN_EXPIRY,
    accessCookieMaxAgeMs: undefined,
    refreshCookieMaxAgeMs: undefined,
  };
}

const register = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { username, password, email, name, role } = req.body;

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
  const usernameOrEmail = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const rememberMe = normalizeRememberMe(req.body?.rememberMe);
  const portal = req.body?.portal === 'customer' ? 'customer' : 'admin';
  const expectedStatusId = portal === 'customer' ? 2 : 1;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: 'Username or email and password are required.' });
  }

  try {
    let user;

    if (portal === 'customer') {
      // Customers authenticate against mt_user_account (the legacy client table).
      // code_no is the key we scope a customer's memorials by across the app.
      let rows = await runQuery(
        db,
        `SELECT id, username, password, email, code_no, number_list, is_active, status
           FROM mt_user_account WHERE username = $1`,
        [usernameOrEmail]
      );
      if (!rows.length) {
        rows = await runQuery(
          db,
          `SELECT id, username, password, email, code_no, number_list, is_active, status
             FROM mt_user_account WHERE email = $1`,
          [usernameOrEmail]
        );
      }
      if (!rows.length) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const acct = rows[0];

      // mt_user_account rows have null is_active/status in the legacy data,
      // so treat "missing" as active; only an explicit inactive value blocks login.
      const activeVal = String(acct.is_active ?? acct.status ?? '').toLowerCase();
      const explicitlyInactive = ['0', 'false', 'inactive', 'no', 'disabled'].includes(activeVal);
      if (explicitlyInactive) {
        return res.status(403).json({
          message: 'Your account is not active. Please contact the administrator.',
        });
      }

      // Normalise to the same shape the rest of login expects below.
      user = {
        id: acct.id,
        username: acct.username,
        password: acct.password,
        email: acct.email,
        name: acct.username,
        role_id: null,
        status_id: expectedStatusId,
        acc_status: 'Active',
        number_list: acct.number_list,
        code_no: acct.code_no,
      };
    } else {
      // Admin — unchanged: authenticate against users.
      let rows = await runQuery(
        db,
        'SELECT id, username, password, email, name, role_id, acc_status, status_id FROM users WHERE username = $1 AND status_id = $2',
        [usernameOrEmail, expectedStatusId]
      );
      if (!rows.length) {
        rows = await runQuery(
          db,
          'SELECT id, username, password, email, name, role_id, acc_status, status_id FROM users WHERE email = $1 AND status_id = $2',
          [usernameOrEmail, expectedStatusId]
        );
      }
      if (!rows.length) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      user = rows[0];
      if (user.acc_status !== 'Active') {
        return res.status(403).json({
          message: 'Your account is not active. Please contact the administrator.',
        });
      }
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Only the users table has a last_login column; skip it for customers.
    if (portal !== 'customer') {
      await runQuery(
        db,
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );
    }

    const sessionConfig = getLoginSessionConfig(rememberMe);
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      roleId: user.role_id,
      statusId: user.status_id,
      portal,
      rememberMe: sessionConfig.rememberMe,
      codeNo: user.code_no ?? null,
    };

    const accessToken = generateAccessToken(tokenPayload, sessionConfig.accessTokenExpiry);
    const refreshToken = generateRefreshToken(tokenPayload, sessionConfig.refreshTokenExpiry);

    res
      .cookie('token', accessToken, getCookieOptions({ maxAgeMs: sessionConfig.accessCookieMaxAgeMs }))
      .cookie('access_token', accessToken, getCookieOptions({ maxAgeMs: sessionConfig.accessCookieMaxAgeMs }))
      .cookie('refreshToken', refreshToken, getCookieOptions({ maxAgeMs: sessionConfig.refreshCookieMaxAgeMs }))
      .json({
        accessToken,
        refreshToken,
        rememberMe: sessionConfig.rememberMe,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          roleId: user.role_id,
          statusId: user.status_id,
          portal,
        }
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const db = getConnection(process.env.DB_TYPE);

  try {
    console.log(`Forgot password requested for email: ${email}`);
    const users = await runQuery(db, 'SELECT * FROM users WHERE email = $1', [email]);
    const user = users[0];

    if (!user) {
      console.log(`Email not found: ${email}`);
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    const token = jwt.sign(
      { userId: user?.id || 0, email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
    await runQuery(db, 'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, token, expiresAt]);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const fixedRecipient = 'bryandev85@gmail.com';

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_USER}>`,
      to: fixedRecipient,
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
    await runQuery(db, 'UPDATE password_resets SET used = true, used_at = NOW() WHERE token = $1', [token]);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashed = await hashPassword(password);
    await runQuery(db, 'UPDATE users SET password = $1 WHERE id = $2', [hashed, decoded.userId]);
    res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error(err);
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

const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const sessionConfig = getLoginSessionConfig(normalizeRememberMe(decoded.rememberMe));
    const payload = {
      userId: decoded.userId,
      username: decoded.username,
      roleId: decoded.roleId,
      rememberMe: sessionConfig.rememberMe,
      portal: decoded.portal,
      statusId: decoded.statusId,
      codeNo: decoded.codeNo ?? null,
    };
    const accessToken = generateAccessToken(payload, sessionConfig.accessTokenExpiry);

    res
      .cookie('token', accessToken, getCookieOptions({ maxAgeMs: sessionConfig.accessCookieMaxAgeMs }))
      .cookie('access_token', accessToken, getCookieOptions({ maxAgeMs: sessionConfig.accessCookieMaxAgeMs }))
      .json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

const logout = async (req, res) => {
  const cookieOptions = getCookieOptions();

  res.clearCookie('refreshToken', cookieOptions);
  res.clearCookie('token', cookieOptions);
  res.clearCookie('access_token', cookieOptions);
  res.json({ message: 'Logged out' });
};

module.exports = { login, refreshToken, logout, register, changePassword, forgotPassword, resetPassword };