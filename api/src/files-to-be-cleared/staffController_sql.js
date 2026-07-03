// controllers/staffController_sql.js
// Cursor-based paginated staff list — does NOT modify staffController.js
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
 * GET /api/staff/list
 * Query params:
 *   limit   – page size (default 20, max 100)
 *   cursor  – opaque cursor from previous response
 *
 * Response:
 *   { data: [...], pagination: { limit, hasMore, nextCursor } }
 */
exports.getStaffs = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const cursor = decodeCursor(req.query.cursor);

    const nameSearch    = req.query.name   || '';
    const emailSearch   = req.query.email  || '';
    const roleSearch    = req.query.role   || '';
    const statusSearch  = req.query.status || '';

    const db = getConnection(process.env.DB_TYPE);

    const params = [limit + 1, nameSearch, emailSearch, roleSearch, statusSearch];
    // $1=limit, $2=name, $3=email, $4=role, $5=status
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
        user_role.role_name AS role
      FROM users
      LEFT JOIN user_role ON users.role_id = user_role.id
      WHERE users.status_id = 1
        AND ($2 = '' OR users.name ILIKE '%' || $2 || '%')
        AND ($3 = '' OR users.email ILIKE '%' || $3 || '%')
        AND ($4 = '' OR user_role.role_name ILIKE '%' || $4 || '%')
        AND ($5 = '' OR users.acc_status = $5)
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
    console.error('Error in staffController_sql.getStaffs:', err);
    next(err);
  }
};
