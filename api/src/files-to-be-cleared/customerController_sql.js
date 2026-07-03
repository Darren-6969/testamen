// controllers/customerController_sql.js
// Cursor-based paginated customer list — does NOT modify customerController.js
const { getConnection, runQuery } = require('../db/connectionManager');

function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function decodeCursor(str) {
  try {
    return JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * GET /api/customers/list
 * Query params:
 *   limit   – page size (default 20, max 100)
 *   cursor  – opaque cursor from previous response
 *
 * Response:
 *   { data: [...], pagination: { limit, hasMore, nextCursor } }
 */
exports.getCustomers = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const cursor = decodeCursor(req.query.cursor);

    const nameSearch        = req.query.name         || '';
    const emailSearch       = req.query.email        || '';
    const contactSearch     = req.query.contact_no   || '';
    const adminSearch       = req.query.admin_name   || '';
    const packageSearch     = req.query.package_name || '';
    const statusSearch      = req.query.status       || '';

    const db = getConnection(process.env.DB_TYPE);

    const params = [limit + 1, nameSearch, emailSearch, contactSearch, adminSearch, packageSearch, statusSearch];
    // $1=limit, $2=name, $3=email, $4=contact_no, $5=admin_name, $6=package_name, $7=status
    let cursorClause = '';

    if (cursor?.id != null) {
      params.push(cursor.id);
      cursorClause = `AND users.id < $${params.length}`;
    }

    const sql = `
      SELECT
        users.id,
        users.name,
        users.email,
        users.username,
        users.acc_status AS status,
        user_role.role_name AS role,
        customer.contact_no,
        customer.customer_code,
        customer.admin_name,
        package.package_name
      FROM users
      LEFT JOIN user_role ON users.role_id = user_role.id
      LEFT JOIN customer ON customer.user_id = users.id
      LEFT JOIN package ON package.id = customer.package
      WHERE users.status_id = 2
        AND ($2 = '' OR users.name ILIKE '%' || $2 || '%')
        AND ($3 = '' OR users.email ILIKE '%' || $3 || '%')
        AND ($4 = '' OR customer.contact_no ILIKE '%' || $4 || '%')
        AND ($5 = '' OR customer.admin_name ILIKE '%' || $5 || '%')
        AND ($6 = '' OR package.package_name ILIKE '%' || $6 || '%')
        AND ($7 = '' OR users.acc_status = $7)
        ${cursorClause}
      ORDER BY users.id DESC
      LIMIT $1
    `;

    const rows = await runQuery(db, sql, params);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const last = data[data.length - 1];

    return res.json({
      data,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore && last ? encodeCursor({ id: last.id }) : null,
      },
    });
  } catch (err) {
    console.error('Error in customerController_sql.getCustomers:', err);
    next(err);
  }
};
