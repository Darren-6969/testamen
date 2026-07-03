const { getConnection, runQuery } = require('../db/connectionManager');

// ============================================================================
//          Get Customer Count for a Given Branch
// ============================================================================
// GET /api/branches/:branchId/customer-count
//
// Join path:
//   branch  →  branch_package (branch_id)  →  customer (package = package_id)
//
// Returns:
//   { ok: true, branch_id, branch_name, branch_code, customer_count }
// ============================================================================
exports.getCustomerCountByBranch = async (req, res, next) => {
  try {
    const db      = getConnection(process.env.DB_TYPE);
    const dbType  = (process.env.DB_TYPE || '').toLowerCase();
    const isPg    = dbType.includes('post');

    const branchId = Number(req.params.branchId);
    if (!branchId || Number.isNaN(branchId)) {
      return res.status(400).json({ ok: false, message: 'Invalid branchId' });
    }

    const p1 = isPg ? '$1' : '?';

    // LEFT JOIN ensures branches with zero customers are still returned.
    // customer.package is the FK that references package.id, which is the
    // same value stored in branch_package.package_id.
    const sql = `
      SELECT
        b.id          AS branch_id,
        b.branch_name,
        b.branch_code,
        COUNT(c.id)   AS customer_count
      FROM branch AS b
      LEFT JOIN branch_package AS bp
        ON bp.branch_id = b.id
      LEFT JOIN customer AS c
        ON c.package = bp.package_id
      WHERE b.id = ${p1}
      GROUP BY b.id, b.branch_name, b.branch_code
      LIMIT 1
    `;

    const rows = await runQuery(db, sql, [branchId]);
    const row  = Array.isArray(rows) ? rows[0] : null;

    if (!row) {
      return res.status(404).json({ ok: false, message: 'Branch not found' });
    }

    return res.json({
      branch_id:      Number(row.branch_id),
      branch_name:    row.branch_name,
      branch_code:    row.branch_code,
      customer_count: Number(row.customer_count || 0),
    });
  } catch (err) {
    console.error('[getCustomerCountByBranch] ERROR:', err);
    next(err);
  }
};

// ============================================================================
//          Get Customer Count for ALL Branches
// ============================================================================
// GET /api/branches/customer-count
//
// Returns an array sorted by customer_count DESC, useful for the dashboard
// to render a per-branch breakdown:
//   [{ branch_id, branch_name, branch_code, customer_count }, ...]
// ============================================================================
exports.getAllBranchCustomerCounts = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      SELECT
        b.id          AS branch_id,
        b.branch_name,
        b.branch_code,
        COUNT(c.id)   AS customer_count
      FROM branch AS b
      LEFT JOIN branch_package AS bp
        ON bp.branch_id = b.id
      LEFT JOIN customer AS c
        ON c.package = bp.package_id
      GROUP BY b.id, b.branch_name, b.branch_code
      ORDER BY customer_count DESC
    `;

    const rows = await runQuery(db, sql, []);

    const data = (rows || []).map(r => ({
      branch_id:      Number(r.branch_id),
      branch_name:    r.branch_name,
      branch_code:    r.branch_code,
      customer_count: Number(r.customer_count || 0),
    }));

    return res.json(data);
  } catch (err) {
    console.error('[getAllBranchCustomerCounts] ERROR:', err);
    next(err);
  }
};
