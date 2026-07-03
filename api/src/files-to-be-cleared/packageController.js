const { getConnection, runQuery } = require('../db/connectionManager');

// ============================================================================
//                       Get All Package
// ============================================================================
exports.getAllPackages = async (req, res, next) => {
  try {
    // Extract requested fields
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
    const defaultQuery = `SELECT * FROM package ORDER BY package_code ASC`;

    // Query with selected fields if provided
    const queryWithCond = `SELECT ${fieldList} FROM package ORDER BY package_code ASC`;

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

// ============================================================================
//                       View Package by ID
// ============================================================================
exports.viewPackage = async (req, res, next) => {
  try {
    const packageId = Number(req.params.id);
    if (!Number.isInteger(packageId)) {
      return res.status(400).json({ message: 'Invalid package id' });
    }
    const db = getConnection(process.env.DB_TYPE); // e.g. "mysql" or "postgres"
    const query = `SELECT * FROM package WHERE id = $1`;
    const values = [packageId];
    const result = await runQuery(db, query, values);
    if (result.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    return res.json(result[0]);
  } catch (err) {
    next(err);
  }
};
