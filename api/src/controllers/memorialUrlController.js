// src/controllers/memorialUrlController.js
// Landing page -> Register module: the public availability checks.
//
// Three read-only endpoints backing the inline validation across the funnel:
//   Step 1  memorial URL   (legacy equivalent: checkurl.php)
//   Step 3  email          (legacy equivalent: checkemail.php)
//   Step 3  username       (no legacy equivalent - see note below)
//
// All three are unauthenticated because they sit ahead of account creation, and
// all three are ADVISORY ONLY. They never write and never reserve anything: a
// value that reads as free here can be taken before the user reaches Step 3.
// The binding checks all happen inside publicRegister's transaction, under the
// registration advisory lock. Treat these as UI hints, not reservations.
//
// Disclosure note: slugs are public by design (www.memodise.com/<slug>), so
// confirming one exists leaks nothing. Email and username are different - these
// endpoints will confirm whether a given address is registered, which is
// account enumeration. That is the same trade the legacy checkemail.php made,
// and it is hard to avoid if you want inline "already registered" feedback, but
// it is a reason to put all three behind a rate limiter before going live.

const { getConnection } = require('../db/connectionManager');
const { checkSlugAvailability } = require('../utils/memorialSlug');
const { isEmailTaken, isUsernameTaken } = require('../utils/registrationCodes');

const MAX_INPUT_LENGTH = 300;

/**
 * GET /api/registration/url-available?value=Mohamad%20Adam
 *
 * 200 -> { input, slug, available, suggestion, message }
 */
exports.checkWebUrl = async (req, res) => {
  try {
    const raw = req.query.value ?? req.query.urlname ?? '';

    if (String(raw).length > MAX_INPUT_LENGTH) {
      return res.status(400).json({ message: 'That name is too long.' });
    }

    const db = getConnection(process.env.DB_TYPE);
    const result = await checkSlugAvailability(db, raw);

    if (result.reason === 'empty') {
      return res.json({ ...result, message: 'Enter a name to generate the memorial URL.' });
    }

    return res.json({
      ...result,
      message: result.available
        ? 'This URL is available.'
        : `This URL is already taken. "${result.suggestion}" is available.`,
    });
  } catch (error) {
    console.error('CHECK MEMORIAL URL ERROR:', error);
    return res.status(500).json({ message: 'Could not check that URL right now.' });
  }
};

/**
 * GET /api/registration/email-available?value=someone@example.com
 *
 * 200 -> { value, valid, available, message }
 *   valid      passed the format check
 *   available  not already on an mt_user_account row
 */
exports.checkEmail = async (req, res) => {
  try {
    const value = String(req.query.value ?? '').trim();

    if (value.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({ message: 'That email is too long.' });
    }

    if (!value) {
      return res.json({ value, valid: false, available: false, message: '' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return res.json({
        value,
        valid: false,
        available: false,
        message: 'Please enter a valid email address.',
      });
    }

    const db = getConnection(process.env.DB_TYPE);
    const taken = await isEmailTaken(db, value);

    return res.json({
      value,
      valid: true,
      available: !taken,
      message: taken
        ? 'This email is already registered. Please log in instead.'
        : 'This email is available.',
    });
  } catch (error) {
    console.error('CHECK EMAIL ERROR:', error);
    return res.status(500).json({ message: 'Could not check that email right now.' });
  }
};

/**
 * GET /api/registration/username-available?value=raymond
 *
 * 200 -> { value, valid, available, message }
 *
 * Why this exists when the legacy flow had no equivalent: login runs
 *   SELECT ... FROM mt_user_account WHERE username = $1
 * and only falls back to email if that returns nothing. The existing data
 * already contains 'TESTING ACCOUNT' twice, so one of those rows can never be
 * reached by username. A unique index cannot be added without cleaning that up
 * first, so uniqueness is enforced at registration instead.
 */
exports.checkUsername = async (req, res) => {
  try {
    const value = String(req.query.value ?? '').trim();

    if (value.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({ message: 'That username is too long.' });
    }

    if (!value) {
      return res.json({ value, valid: false, available: false, message: '' });
    }

    const db = getConnection(process.env.DB_TYPE);
    const taken = await isUsernameTaken(db, value);

    return res.json({
      value,
      valid: true,
      available: !taken,
      message: taken
        ? 'This username is already taken. Please choose another.'
        : 'This username is available.',
    });
  } catch (error) {
    console.error('CHECK USERNAME ERROR:', error);
    return res.status(500).json({ message: 'Could not check that username right now.' });
  }
};