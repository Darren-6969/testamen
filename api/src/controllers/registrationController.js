// src/controllers/registrationController.js
//
// Landing page -> Register module. publicRegister is the single write for the
// whole three-step funnel: nothing is persisted at Step 1 or Step 2, so an
// abandoned form leaves no half-built account behind. (The Step 2 profile
// picture is the one exception - it is uploaded early and referenced by
// filename here. See registerMediaController.)
//
// The previous version of this handler was written against a schema that does
// not exist: it inserted mt_user_account columns such as user_id, memorial_name,
// web_url, deceased_full_name, relationship and message, wrote to the legacy
// `users` table, set code_no to `USR-<id>`, and never touched mt_deceased or
// mt_profile at all. It has been replaced wholesale rather than patched.
//
// WHAT ONE REGISTRATION WRITES
//   mt_user_account  the administrator's login
//   mt_deceased      the memorial's identity row (url_name, code_no, number_list)
//   mt_profile       the memorial's content row (the Step 1 detail fields)
//
// All three share code_no, which is what actually scopes ownership across the
// app - one account, many memorials, joined on code_no.
//
// TRANSACTION AND LOCKING
//
// None of the three tables has a sequence, so every id is COALESCE(MAX(id),0)+1
// and every number_list is MAX+1. Under concurrency two registrations would
// happily compute the same values. Rather than guard each one, the whole commit
// takes a single transaction-scoped advisory lock: registrations serialise.
// At this volume that costs nothing and removes the entire race class,
// including the url_name collision window that the Step 1 check cannot close.
//
// DEDICATED CONNECTION - please do not "simplify" this away.
//
// connectionManager holds ONE shared pg Client, not a pool. Issuing BEGIN on it
// would put every other in-flight request's query inside this transaction, and
// roll them back with it on failure. So the commit opens its own Client, uses
// it for the transaction only, and closes it in `finally`. Reads outside the
// transaction still use the shared connection.

const { Client: PgClient } = require('pg');
const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword } = require('../utils/hashUtils');
const { reserveSlug } = require('../utils/memorialSlug');
const {
  nextId,
  nextNumberList,
  generateCodeNo,
  generateReferralCode,
  isEmailTaken,
  isUsernameTaken,
  findReferrer,
  awardReferralBonus,
} = require('../utils/registrationCodes');

// Free plan. Matches the hidden feature_id=1 the legacy activation page posted.
const DEFAULT_FEATURE_ID = '1';
const PUBLIC_BASE_URL = process.env.MEMORIAL_PUBLIC_BASE_URL || 'https://www.memodise.com';

// Arbitrary but fixed: the advisory lock key that serialises registrations.
const REGISTRATION_LOCK_KEY = 918273645;

const UPDATABLE_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'gender',
  'phone_number',
  'country_code',
  'status',
];

const trimmed = (value) => String(value ?? '').trim();

/** Empty string -> null, so blank optional fields do not become '' in the DB. */
const orNull = (value) => {
  const out = trimmed(value);
  return out === '' ? null : out;
};

/** Accepts M/F/O; anything else becomes null rather than a junk value. */
const normalizeGender = (value) => {
  const out = trimmed(value).toUpperCase();
  return ['M', 'F', 'O'].includes(out) ? out : null;
};

/** Empty date strings must be null - '' is not a valid Postgres date. */
const normalizeDate = (value) => orNull(value);

/**
 * POST /api/registration/public/register
 */
exports.publicRegister = async (req, res) => {
  const body = req.body || {};

  // ---- Step 1: memorial ----
  const deceasedFullName = trimmed(body.deceasedFullName || body.memorialName);
  const deceasedGender = normalizeGender(body.deceasedGender);
  const deceasedProfession = orNull(body.deceasedProfession);
  const deceasedDob = normalizeDate(body.deceasedDob);
  const deceasedBirthLocation = orNull(body.deceasedBirthLocation);
  const deceasedPassAwayDate = normalizeDate(body.deceasedPassAwayDate);
  const deceasedPassAwayLocation = orNull(body.deceasedPassAwayLocation);
  const relationship = orNull(body.relationship);
  const requestedUrl = trimmed(body.webUrl) || deceasedFullName;

  // ---- Step 2: template ----
  const profilePictureName = orNull(body.profilePictureName);
  const musicName = orNull(body.musicName);

  // ---- Step 3: administrator ----
  const username = trimmed(body.username);
  const firstName = orNull(body.firstName);
  const lastName = orNull(body.lastName);
  const email = trimmed(body.email);
  const adminGender = normalizeGender(body.adminGender);
  const countryCode = orNull(body.countryCode);
  const phoneNumber = orNull(body.adminContact || body.contactNumber);
  const referrerCode = orNull(body.referrerCode);
  const password = String(body.password ?? '');

  // ---- Validation (mirrors the client, because the client is not a gate) ----
  const missing = [];
  if (!deceasedFullName) missing.push('deceased full name');
  if (!deceasedGender) missing.push('deceased gender');
  if (!username) missing.push('username');
  if (!email) missing.push('email');
  if (!password) missing.push('password');

  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}.` });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  // Same rule as the form's pattern attribute and the legacy check_pass().
  if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password)) {
    return res.status(400).json({
      message:
        'Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number.',
    });
  }

  const shared = getConnection(process.env.DB_TYPE);

  // Pre-flight on the shared connection. These are re-checked inside the
  // transaction; doing them here just returns a friendlier error sooner.
  try {
    if (await isEmailTaken(shared, email)) {
      return res.status(409).json({ message: 'That email is already registered. Please log in instead.' });
    }
    if (await isUsernameTaken(shared, username)) {
      return res.status(409).json({ message: 'That username is already taken. Please choose another.' });
    }
  } catch (error) {
    console.error('REGISTRATION PRECHECK ERROR:', error);
    return res.status(500).json({ message: 'Could not verify your details. Please try again.' });
  }

  // Dedicated connection for the transaction - see the header note.
  const db = new PgClient({
    host: process.env.PG_HOST,
    port: +process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASS,
    database: process.env.PG_DB,
  });

  try {
    await db.connect();
  } catch (error) {
    console.error('REGISTRATION CONNECT ERROR:', error);
    return res.status(500).json({ message: 'Could not reach the database. Please try again.' });
  }

  let committed = false;

  try {
    await runQuery(db, 'BEGIN');
    // Serialise registrations. Released automatically on COMMIT or ROLLBACK.
    await runQuery(db, 'SELECT pg_advisory_xact_lock($1)', [REGISTRATION_LOCK_KEY]);

    // Re-check inside the lock: the pre-flight above raced.
    if (await isEmailTaken(db, email)) {
      await runQuery(db, 'ROLLBACK');
      return res.status(409).json({ message: 'That email is already registered. Please log in instead.' });
    }
    if (await isUsernameTaken(db, username)) {
      await runQuery(db, 'ROLLBACK');
      return res.status(409).json({ message: 'That username is already taken. Please choose another.' });
    }

    // A referral code that no longer resolves is not worth failing a
    // registration over - it is recorded as given and simply earns nothing.
    let resolvedReferrer = null;
    if (referrerCode) {
      resolvedReferrer = await findReferrer(db, referrerCode);
    }

    // ---- Mint everything up front, so the account row can carry the
    // ---- memorial's id and the memorial rows can carry the account's code_no.
    const codeNo = await generateCodeNo(db);
    const referralCode = await generateReferralCode(db);
    const slug = await reserveSlug(db, requestedUrl);

    const accountId = await nextId(db, 'mt_user_account');
    const deceasedId = await nextId(db, 'mt_deceased');
    const profileId = await nextId(db, 'mt_profile');

    // Two independent counters that happen to share a column name.
    const accountNumberList = await nextNumberList(db, 'mt_user_account');
    const memorialNumberList = await nextNumberList(db, 'mt_deceased');

    const passwordHash = await hashPassword(password);
    const fullUrl = `${PUBLIC_BASE_URL}/${slug}`;

    // ---- 1. mt_user_account ------------------------------------------------
    // memorial_id records the memorial this account registered with. It stores
    // an mt_deceased.id (NOT number_list - the identically named column on
    // mt_profile means number_list, which is a pre-existing inconsistency).
    // Nothing reads it; it is a breadcrumb and will not follow later memorials.
    await runQuery(
      db,
      `INSERT INTO mt_user_account (
         id, username, code_no, memorial_id,
         first_name, last_name, email, gender,
         link, created, modified, password,
         phone_number, country_code, start_date,
         feature_id, referral_code, referrer_code, referral_bonus_mb,
         is_active, create_date, number_list, "show"
       ) VALUES (
         $1, $2, $3, $4,
         $5, $6, $7, $8,
         $9, CURRENT_DATE, CURRENT_DATE, $10,
         $11, $12, CURRENT_DATE,
         $13, $14, $15, '0',
         '1', CURRENT_DATE, $16, true
       )`,
      [
        accountId,
        username,
        codeNo,
        String(deceasedId),
        firstName,
        lastName,
        email,
        adminGender,
        fullUrl,
        passwordHash,
        phoneNumber,
        countryCode,
        DEFAULT_FEATURE_ID,
        referralCode,
        resolvedReferrer ? resolvedReferrer.referral_code : referrerCode,
        accountNumberList,
      ]
    );

    // ---- 1b. Referral bonus -------------------------------------------------
    // Credits the REFERRER, not this new account - see awardReferralBonus. Runs
    // after the insert above so the cap count includes this registration.
    // Inside the transaction: if anything below fails, the bonus is rolled back
    // with the account rather than left credited for a registration that never
    // completed.
    if (resolvedReferrer) {
      const bonus = await awardReferralBonus(db, resolvedReferrer);
      if (bonus.reason === 'cap_reached') {
        console.info(
          `Referral cap reached for ${resolvedReferrer.referral_code}: ` +
            `${bonus.used} used, max ${bonus.maxReferrals}. No bonus awarded.`
        );
      }
    }

    // ---- 2. mt_deceased ----------------------------------------------------
    // url_name holds the slug only; the full URL lives on mt_user_account.link.
    // Gender is stored as M/F/O here, matching mt_profile. Legacy rows use
    // 'MALE'/'Male', so anything reading this column must tolerate both.
    await runQuery(
      db,
      `INSERT INTO mt_deceased (
         id, code_no, url_name, status, memorial_name,
         register_date, number_list, gender, registered_account, "show"
       ) VALUES (
         $1, $2, $3, 'Active', $4,
         CURRENT_DATE, $5, $6, $7, true
       )`,
      [
        deceasedId,
        codeNo,
        slug,
        deceasedFullName,
        memorialNumberList,
        deceasedGender,
        email,
      ]
    );

    // ---- 3. mt_profile -----------------------------------------------------
    // memorial_id = mt_deceased.number_list. This is the convention the customer
    // portal reads (adminProfileController joins mt_profile ON memorial_id and
    // mt_deceased ON number_list with the same value).
    // acc_id = mt_user_account.id, as a string - the column is varchar(10).
    await runQuery(
      db,
      `INSERT INTO mt_profile (
         id, acc_id, code_no, fullname, gender, career,
         born, pass_date, pass_location, place_birth,
         profile_pic, music, relationship,
         memorial_id, privacy, last_modified_date
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10,
         $11, $12, $13,
         $14, 'Public', CURRENT_DATE
       )`,
      [
        profileId,
        String(accountId),
        codeNo,
        deceasedFullName,
        deceasedGender,
        deceasedProfession,
        deceasedDob,
        deceasedPassAwayDate,
        deceasedPassAwayLocation,
        deceasedBirthLocation,
        profilePictureName,
        musicName,
        relationship,
        memorialNumberList,
      ]
    );

    await runQuery(db, 'COMMIT');
    committed = true;

    return res.status(201).json({
      message: 'Registration complete.',
      memorialUrl: fullUrl,
      slug,
      username,
      email,
    });
  } catch (error) {
    console.error('PUBLIC REGISTRATION ERROR:', error);
    try {
      if (!committed) await runQuery(db, 'ROLLBACK');
    } catch (rollbackError) {
      console.error('PUBLIC REGISTRATION ROLLBACK ERROR:', rollbackError);
    }

    return res.status(500).json({
      message: 'Failed to complete registration.',
      detail: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  } finally {
    try {
      await db.end();
    } catch (_) {
      /* connection already gone */
    }
  }
};

/**
 * Get single registration by ID
 */
exports.getRegistration = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const rows = await runQuery(
      db,
      `SELECT *,
              created AS registration_date,
              phone_number AS contact
         FROM mt_user_account
        WHERE id = $1
          AND "show" = true`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('GET REGISTRATION ERROR:', error);
    return res.status(500).json({ message: 'Failed to retrieve registration' });
  }
};

/**
 * Get all registrations (list)
 */
exports.getAllRegistrations = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const rows = await runQuery(
      db,
      `SELECT *,
              created AS registration_date,
              phone_number AS contact
         FROM mt_user_account
        WHERE "show" = true
        ORDER BY id ASC`
    );

    return res.json(rows || []);
  } catch (error) {
    console.error('GET ALL REGISTRATIONS ERROR:', error);
    return res.status(500).json({ message: 'Failed to retrieve registrations' });
  }
};

/**
 * Update registration
 */
exports.updateRegistration = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const body = req.body || {};
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    UPDATABLE_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        setClauses.push(`"${field}" = $${paramIndex}`);
        values.push(body[field] === '' ? null : body[field]);
        paramIndex += 1;
      }
    });

    if (!setClauses.length) {
      return res.status(400).json({ message: 'No editable fields provided.' });
    }

    setClauses.push('modified = CURRENT_DATE');
    values.push(id);

    const rows = await runQuery(
      db,
      `UPDATE mt_user_account
          SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
          AND "show" = true
        RETURNING *`,
      values
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    return res.json({
      message: 'Registration updated successfully.',
      registration: rows[0],
    });
  } catch (error) {
    console.error('UPDATE REGISTRATION ERROR:', error);
    return res.status(500).json({ message: 'Failed to update registration' });
  }
};

/**
 * Soft delete registration
 */
exports.deleteRegistration = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    await runQuery(db, `UPDATE mt_user_account SET "show" = false WHERE id = $1`, [id]);
    return res.json({ success: true, message: 'Soft delete successful' });
  } catch (error) {
    console.error('DELETE ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};