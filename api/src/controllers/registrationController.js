const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword, comparePassword } = require('../utils/hashUtils');

const CUSTOMER_ROLE_ID = 2;
const CUSTOMER_STATUS_ID = 2;

const UPDATABLE_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'gender',
  'phone_number',
  'country_code',
  'status',
];

const splitName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: parts[0] || '', lastName: '' };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

const normalizeDate = (value) => {
  if (!value) return null;
  return value;
};

const normalizeBoolean = (value) => value === true || value === 'true' || value === 'yes' || value === '1';

exports.publicRegister = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  const {
    name,
    email,
    username,
    password,
    contactNumber,
    countryCode,
    adminContact,
    memorialName,
    deceasedFullName,
    deceasedGender,
    deceasedProfession,
    deceasedDob,
    deceasedBirthLocation,
    deceasedPassAwayDate,
    deceasedPassAwayLocation,
    relationship,
    webUrl,
    profilePictureName,
    musicName,
    themeName,
    hasReferral,
    referrerCode,
    servicePlan,
    featureId,
    message,
  } = req.body || {};

  const cleanedEmail = String(email || '').trim().toLowerCase();
  const cleanedUsername = String(username || cleanedEmail).trim().toLowerCase();
  const cleanedName = String(name || '').trim();

  if (!cleanedName || !cleanedEmail || !cleanedUsername || !password) {
    return res.status(400).json({
      message: 'Name, email, username, and password are required.',
    });
  }

  if (!deceasedFullName) {
    return res.status(400).json({ message: 'Deceased full name is required.' });
  }

  try {
    await db.query('BEGIN');

    const existingUsers = await runQuery(
      db,
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2) LIMIT 1',
      [cleanedUsername, cleanedEmail]
    );

    if (existingUsers.length) {
      await db.query('ROLLBACK');
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    const hashedPassword = await hashPassword(password);
    const insertedUsers = await runQuery(
      db,
      `INSERT INTO users
        (username, password, name, email, role_id, acc_status, status_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, name, role_id, status_id`,
      [
        cleanedUsername,
        hashedPassword,
        cleanedName,
        cleanedEmail,
        CUSTOMER_ROLE_ID,
        'Active',
        CUSTOMER_STATUS_ID,
      ]
    );

    const user = insertedUsers[0];
    const adminName = splitName(cleanedName);
    const nextAccountIdResult = await runQuery(
      db,
      'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM mt_user_account'
    );
    const accountId = Number(nextAccountIdResult[0]?.next_id || 1);
    const memorialTitle = String(memorialName || deceasedFullName).trim();
    const referralEnabled = normalizeBoolean(hasReferral);

    const insertedAccounts = await runQuery(
      db,
      `INSERT INTO mt_user_account
        (
          id,
          user_id,
          username,
          code_no,
          memorial_id,
          first_name,
          last_name,
          email,
          gender,
          created,
          modified,
          phone_number,
          country_code,
          start_date,
          premium_id,
          feature_id,
          referrer_code,
          is_active,
          create_date,
          verification_status,
          status,
          show,
          memorial_name,
          web_url,
          profile_picture_name,
          music_name,
          theme_name,
          admin_full_name,
          admin_contact,
          has_referral,
          deceased_full_name,
          deceased_gender,
          deceased_profession,
          deceased_dob,
          deceased_birth_location,
          deceased_pass_away_date,
          deceased_pass_away_location,
          relationship,
          message
        )
       VALUES
        (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, CURRENT_DATE,
          $10, $11, CURRENT_DATE, $12, $13, $14, $15, CURRENT_DATE, $16, $17, true,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
        )
       RETURNING id`,
      [
        accountId,
        user.id,
        cleanedUsername,
        `USR-${user.id}`,
        webUrl || memorialTitle,
        adminName.firstName,
        adminName.lastName,
        cleanedEmail,
        deceasedGender || null,
        contactNumber || adminContact || null,
        countryCode || null,
        servicePlan || null,
        featureId ? String(featureId) : null,
        referralEnabled ? referrerCode || null : null,
        'Active',
        'verified',
        'Active',
        memorialTitle,
        webUrl || null,
        profilePictureName || null,
        musicName || null,
        themeName || null,
        cleanedName,
        adminContact || contactNumber || null,
        referralEnabled,
        deceasedFullName,
        deceasedGender || null,
        deceasedProfession || null,
        normalizeDate(deceasedDob),
        deceasedBirthLocation || null,
        normalizeDate(deceasedPassAwayDate),
        deceasedPassAwayLocation || null,
        relationship || null,
        message || null,
      ]
    );

    await db.query('COMMIT');

    return res.status(201).json({
      message: 'Registration created successfully.',
      user,
      accountId: insertedAccounts[0]?.id,
    });
  } catch (error) {
    try {
      await db.query('ROLLBACK');
    } catch (_) {
    }

    console.error('PUBLIC REGISTRATION ERROR:', error);
    return res.status(500).json({
      message: 'Failed to create registration.',
      detail: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
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

    const query = `
      SELECT *,
        created AS registration_date,
        phone_number AS contact
      FROM mt_user_account
      WHERE id = ${id}
      AND "show" = true
    `;

    const rows = await runQuery(db, query);

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

    const query = `
      SELECT *,
        created AS registration_date,
        phone_number AS contact
      FROM mt_user_account
      WHERE "show" = true
      ORDER BY id ASC
    `;

    const rows = await runQuery(db, query);
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

    const query = `
      UPDATE mt_user_account
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      AND "show" = true
      RETURNING *
    `;

    const rows = await runQuery(db, query, values);

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
    console.log('DELETE ID:', id);

    const query = `
      UPDATE mt_user_account
      SET "show" = false
      WHERE id = ${id}
    `;

    await runQuery(db, query);
    return res.json({ success: true, message: 'Soft delete successful' });
  } catch (error) {
    console.error('DELETE ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};