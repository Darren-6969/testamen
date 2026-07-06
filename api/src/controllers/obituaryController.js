// controllers/settingController.js
const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword, comparePassword } = require('../utils/hashUtils');


exports.getObituary= async (req, res, next) => {
    try {
    // Extract requested fields

    //fields : {'code_no','first_name'}
    const { fields } = req.body || {};
    let fieldList;

    if (Array.isArray(fields) && fields.length > 0) {
      // Prevent SQL injection by sanitizing column names:
      // - allow letters, numbers, underscore, dot, and space (for aliases)
      fieldList = fields
        .map(f => f.replace(/[^a-zA-Z0-9_\. ]/g, ''))
        .join(', ');
    }

    // Default query (all columns + join with user_role)
    const defaultQuery = `SELECT * FROM mt_obituary `;

    // Query with selected fields if provided
    const queryWithCond = `SELECT ${fieldList} FROM mt_obituary`;

    // ------------------------------------------------------------------------
    // Run Query
    // ------------------------------------------------------------------------
    try {
      const db = getConnection(process.env.DB_TYPE); // e.g. "mysql" or "postgres"
      const query = fieldList ? queryWithCond : defaultQuery;
      let rows = await runQuery(db, query);
      return res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve results' });
    }


    // ------------------------------------------------------------------------
    // No Database Configured
    // ------------------------------------------------------------------------
    return res.status(500).json({ error: 'No database configured.' });
  } catch (err) {
    next(err);
  }

};

/**
 * GET /api/obituary/:id
 * Fetch a single obituary record by its primary key (mt_obituary.id).
 *
 * NOTE: uses `id`, not `mf_id` — mf_id is the creator/account id and is
 * shared across every obituary that account has created, so it is not a
 * valid per-record lookup key (confirmed against real data in the backup).
 */
exports.getObituaryById = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { id } = req.params;

    const query = `SELECT * FROM mt_obituary WHERE id = $1 LIMIT 1`;
    const rows = await runQuery(db, query, [id]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Obituary not found',
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.error('getObituaryById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve obituary',
    });
  }
};