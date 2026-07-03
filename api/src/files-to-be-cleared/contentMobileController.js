const fs   = require('fs');
const path = require('path');
const { getConnection, runQuery } = require('../db/connectionManager');
// const { hashPassword } = require('../utils/hashUtils'); // not used here but left as-is
// const { logAudit, diffObjects, resolveActor } = require("../utils/audit");

let MongoUser;

// ============================================================================
//                       MongoDB Model Initialization
// ============================================================================
if (process.env.USE_MONGO === 'true') {
  const conn = getConnection('mongo');
  MongoUser = conn.model('User', require('../models/user').schema);
}

// ============================================================================
//                       Get All Content
// ============================================================================
exports.getContent = async (req, res, next) => {
  try {
    const { fields } = req.body || {};
    let fieldList;

    if (Array.isArray(fields) && fields.length > 0) {
      fieldList = fields
        .map((f) => f.replace(/[^a-zA-Z0-9_\. ]/g, ""))
        .join(", ");
    }

    const db = getConnection(process.env.DB_TYPE);

    // ✅ active + show + today within (start_date, end_date)
    const whereClause = `
      WHERE status = 'ACTIVE'
        AND (display_status IS NULL OR display_status = 'SHOW')
        AND (start_date IS NULL OR start_date <= CURRENT_DATE)
        AND (end_date   IS NULL OR end_date   >= CURRENT_DATE)
    `;

    const defaultQuery = `SELECT * FROM content ${whereClause} ORDER BY start_date DESC NULLS LAST, id DESC`;
    const queryWithCond = `SELECT ${fieldList} FROM content ${whereClause} ORDER BY start_date DESC NULLS LAST, id DESC`;

    const query = fieldList ? queryWithCond : defaultQuery;
    const rows = await runQuery(db, query);

    return res.json(rows);
  } catch (error) {
    console.error("Error in getContent:", error);
    return res.status(500).json({ message: "Failed to retrieve results" });
  }
};