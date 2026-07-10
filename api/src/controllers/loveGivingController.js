// src/controllers/loveGivingController.js

const { getConnection, runQuery } = require('../db/connectionManager');

// Whitelist of editable fields -> real DB column names.
// Left = payload key from the frontend, right = actual column in mt_love_giving.
const FIELD_TO_COLUMN = {
  account_name: 'account_name',
  account_number: 'accoount_number', // note the DB typo
  bank_name: 'bank_name',
  bank_number: 'bank_number',
  bank_branch: 'bank_branch',
  branch_code: 'branch_code',
};

// Pull only known fields from the request body, coerced to string|null.
function pickFields(body = {}) {
  const out = {};
  for (const key of Object.keys(FIELD_TO_COLUMN)) {
    const val = body[key];
    out[key] = val === undefined || val === null || val === '' ? null : String(val);
  }
  return out;
}

/**
 * GET /api/love-giving/by-memorial/:memorialId
 * Returns the single love-giving row for a memorial (or null if none yet).
 */
exports.getLoveGivingByMemorial = async (req, res) => {
  try {
    const { memorialId } = req.params;
    if (!memorialId) {
      return res.status(400).json({ message: 'memorialId is required' });
    }

    const db = getConnection(process.env.DB_TYPE);
    const query = `
      SELECT
        id,
        account_name,
        accoount_number AS account_number,
        bank_name,
        bank_number,
        bank_branch,
        branch_code,
        memorial_id
      FROM mt_love_giving
      WHERE memorial_id = $1
      LIMIT 1
    `;
    const rows = await runQuery(db, query, [String(memorialId)]);
    return res.json(rows && rows.length ? rows[0] : null);
  } catch (error) {
    console.error('getLoveGivingByMemorial error:', error);
    return res.status(500).json({ message: 'Failed to load love giving details' });
  }
};

/**
 * POST /api/love-giving/save
 * Body: { memorialId, account_name, account_number, bank_name, bank_number,
 *         bank_branch, branch_code }
 * Upserts by memorial_id.
 */
exports.saveLoveGiving = async (req, res) => {
  try {
    const memorialId = req.body.memorialId;
    if (!memorialId) {
      return res.status(400).json({ message: 'memorialId is required' });
    }

    const db = getConnection(process.env.DB_TYPE);
    const fields = pickFields(req.body); // keyed by payload names
    const createBy = String(req.user?.userId || '').slice(0, 10); // create_by is varchar(10)

    // Does a row already exist for this memorial?
    const existing = await runQuery(
      db,
      `SELECT id FROM mt_love_giving WHERE memorial_id = $1 LIMIT 1`,
      [String(memorialId)]
    );

    if (existing && existing.length) {
      // ---- UPDATE the 6 detail fields ----
      const cols = Object.keys(fields); // payload keys
      const setClause = cols
        .map((key, i) => `${FIELD_TO_COLUMN[key]} = $${i + 1}`)
        .join(', ');
      const values = cols.map((key) => fields[key]);
      values.push(String(memorialId)); // last param = memorial_id

      const updateSql = `
        UPDATE mt_love_giving
        SET ${setClause}
        WHERE memorial_id = $${cols.length + 1}
        RETURNING
          id, account_name, accoount_number AS account_number,
          bank_name, bank_number, bank_branch, branch_code, memorial_id
      `;
      const rows = await runQuery(db, updateSql, values);
      return res.json({ status: 'success', data: rows[0] });
    }

    // ---- INSERT (manual id, no sequence) ----
    const nextRows = await runQuery(
      db,
      `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM mt_love_giving`
    );
    const nextId = nextRows[0].next_id;

    const insertSql = `
      INSERT INTO mt_love_giving
        (id, account_name, accoount_number, bank_name, bank_number,
         bank_branch, branch_code, create_by, create_date, create_time, memorial_id)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, to_char(NOW(), 'HH24:MI:SS'), $9)
      RETURNING
        id, account_name, accoount_number AS account_number,
        bank_name, bank_number, bank_branch, branch_code, memorial_id
    `;
    const insertValues = [
      nextId,
      fields.account_name,
      fields.account_number,
      fields.bank_name,
      fields.bank_number,
      fields.bank_branch,
      fields.branch_code,
      createBy,
      String(memorialId),
    ];
    const rows = await runQuery(db, insertSql, insertValues);
    return res.json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('saveLoveGiving error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to save love giving details' });
  }
};