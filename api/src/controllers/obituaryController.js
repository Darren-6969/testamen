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