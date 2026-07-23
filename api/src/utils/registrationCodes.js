// src/utils/registrationCodes.js
// Landing page -> Register module -> Step 3 "Admin's account details".
//
// Every identifier minted during the public registration commit lives here.
// None of these tables has a sequence, so each one is computed by hand under the
// transaction's advisory lock - see registrationController.publicRegister.

const { runQuery } = require('../db/connectionManager');

const CODE_NO_DIGITS = 12;
const REFERRAL_CODE_LENGTH = 6;
// Uppercase alphanumeric, matching the existing 4KE7PL / D79SSQ / PLSV49 format.
const REFERRAL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const MAX_ATTEMPTS = 50;

/**
 * Next integer primary key for a sequence-less table.
 *
 * mt_user_account, mt_deceased and mt_profile all declare `id integer NOT NULL`
 * with no sequence and no DEFAULT, so nothing assigns it for us.
 */
async function nextId(db, table) {
  const rows = await runQuery(db, `SELECT COALESCE(MAX(id), 0) + 1 AS next FROM ${table}`);
  return Number(rows[0].next);
}

/**
 * Next running number for a table's `number_list` column.
 *
 * IMPORTANT: mt_user_account.number_list and mt_deceased.number_list are two
 * INDEPENDENT counters that merely share a column name. Accounts currently run
 * 1..25, memorials 1..15. Do not derive one from the other.
 *
 * The column is varchar(10) and holds non-numeric seed values ('TEST03'), so the
 * regex filter keeps those out of MAX - without it, MAX() would compare
 * lexically and return 'TEST05'.
 */
async function nextNumberList(db, table) {
  const rows = await runQuery(
    db,
    `SELECT COALESCE(MAX(number_list::int), 0) + 1 AS next
       FROM ${table}
      WHERE number_list ~ '^[0-9]+$'`
  );
  return String(rows[0].next);
}

/** Cryptographically-unremarkable but adequate random digit string. */
function randomDigits(length) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += Math.floor(Math.random() * 10);
  }
  return out;
}

/**
 * A 12-digit account code, unique across mt_user_account.
 *
 * code_no is the key every memorial is scoped by (mt_deceased.code_no,
 * mt_profile.code_no, and the JWT's codeNo), so a duplicate would silently merge
 * two customers' memorials into one dashboard.
 *
 * The legacy PHP generator did NOT check for collisions - 183771755626 sits on
 * two different accounts (EE and TTTt, registered the same day). This one does.
 */
async function generateCodeNo(db) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = randomDigits(CODE_NO_DIGITS);
    // eslint-disable-next-line no-await-in-loop
    const rows = await runQuery(
      db,
      `SELECT 1 FROM mt_user_account WHERE code_no = $1 LIMIT 1`,
      [candidate]
    );
    if (!rows.length) return candidate;
  }

  throw new Error('Could not generate a unique account code.');
}

/**
 * A 6-character referral code, unique across mt_user_account.
 *
 * Same story as code_no: the legacy generator collided (CMT773 appears on both
 * account 46 and account 63), which would let two accounts claim each other's
 * referrals. Checked here.
 */
async function generateReferralCode(db) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    let candidate = '';
    for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
      candidate += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)];
    }

    // eslint-disable-next-line no-await-in-loop
    const rows = await runQuery(
      db,
      `SELECT 1 FROM mt_user_account WHERE referral_code = $1 LIMIT 1`,
      [candidate]
    );
    if (!rows.length) return candidate;
  }

  throw new Error('Could not generate a unique referral code.');
}

/**
 * Is this email already registered? Case-insensitive.
 */
async function isEmailTaken(db, email) {
  const rows = await runQuery(
    db,
    `SELECT 1 FROM mt_user_account WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );
  return rows.length > 0;
}

/**
 * Is this username already registered? Case-insensitive.
 *
 * Worth enforcing even though no unique index exists (and none can be added -
 * 'TESTING ACCOUNT' is already on two rows). Login runs
 *   SELECT ... WHERE username = $1
 * BEFORE falling back to email, so a duplicate username means whichever row
 * sorts second can never sign in by username.
 */
async function isUsernameTaken(db, username) {
  const rows = await runQuery(
    db,
    `SELECT 1 FROM mt_user_account WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username]
  );
  return rows.length > 0;
}

/**
 * Does this referrer code belong to a real account?
 * Returns the owning row, or null.
 */
async function findReferrer(db, code) {
  const rows = await runQuery(
    db,
    `SELECT id, code_no, referral_code FROM mt_user_account
      WHERE UPPER(referral_code) = UPPER($1) LIMIT 1`,
    [code]
  );
  return rows[0] || null;
}

/**
 * Credit the REFERRER with bonus storage for a successful referral.
 *
 * Who gets the bonus: the referrer, not the new account. The legacy activation
 * page was explicit about this - both places it touched the field commented
 * "new user gets 0 bonus" / "new user always 0 bonus" and posted 0. So a new
 * registration starts on its plan's storage with no uplift, and the person
 * whose code was used earns the MB.
 *
 * The rest of the plumbing already exists: storageQuota.getQuota() computes
 *   totalMb = mt_feature.storage_mb + mt_user_account.referral_bonus_mb
 * so incrementing that column is all that is needed for the extra space to
 * appear on the referrer's dashboard.
 *
 * Rates come from mt_referral_settings (mb_per_referral, max_referrals). The
 * table is created lazily by referralSettingsController, so a missing row falls
 * back to the same defaults that controller documents: 10 MB, 4 referrals.
 *
 * Call this AFTER the new account row is inserted - the cap counts rows citing
 * this code, and the new one must be included so the Nth referral is the last
 * to earn.
 *
 * referral_bonus_mb is varchar(20) and legacy rows may hold junk, so the
 * increment strips non-digits before casting rather than trusting the value.
 */
async function awardReferralBonus(db, referrer) {
  if (!referrer || !referrer.referral_code) return { awarded: 0, reason: 'no_referrer' };

  const settingsRows = await runQuery(
    db,
    `SELECT mb_per_referral, max_referrals
       FROM mt_referral_settings
      ORDER BY id ASC
      LIMIT 1`
  );

  const mbPerReferral = Number(settingsRows[0]?.mb_per_referral ?? 10);
  const maxReferrals = Number(settingsRows[0]?.max_referrals ?? 4);

  if (!Number.isFinite(mbPerReferral) || mbPerReferral <= 0) {
    return { awarded: 0, reason: 'disabled' };
  }

  const usedRows = await runQuery(
    db,
    `SELECT COUNT(*)::int AS used
       FROM mt_user_account
      WHERE UPPER(referrer_code) = UPPER($1)`,
    [referrer.referral_code]
  );

  const used = Number(usedRows[0]?.used || 0);
  if (Number.isFinite(maxReferrals) && maxReferrals > 0 && used > maxReferrals) {
    return { awarded: 0, reason: 'cap_reached', used, maxReferrals };
  }

  await runQuery(
    db,
    `UPDATE mt_user_account
        SET referral_bonus_mb =
              (COALESCE(NULLIF(regexp_replace(COALESCE(referral_bonus_mb, ''), '\\D', '', 'g'), '')::int, 0) + $1)::text,
            modified = CURRENT_DATE
      WHERE id = $2`,
    [mbPerReferral, referrer.id]
  );

  return { awarded: mbPerReferral, reason: 'awarded', used, maxReferrals };
}

module.exports = {
  CODE_NO_DIGITS,
  REFERRAL_CODE_LENGTH,
  nextId,
  nextNumberList,
  generateCodeNo,
  generateReferralCode,
  isEmailTaken,
  isUsernameTaken,
  findReferrer,
  awardReferralBonus,
};