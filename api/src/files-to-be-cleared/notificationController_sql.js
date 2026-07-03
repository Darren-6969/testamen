// controllers/notificationController_sql.js
// Cursor-based paginated unread notifications — does NOT modify notificationController.js
const { getConnection, runQuery } = require('../db/connectionManager');

function getCurrentUserId(req) {
  if (req.user && req.user.id) return req.user.id;
  if (req.user && req.user.userId) return req.user.userId;
  if (req.user && req.user.user_id) return req.user.user_id;
  if (req.session && req.session.user && req.session.user.id) {
    return req.session.user.id;
  }
  return null;
}

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
 * GET /api/notifications/unread/list
 * Query params:
 *   limit   – page size (default 20, max 100)
 *   cursor  – opaque cursor from previous response
 *
 * Response:
 *   { data: [...], pagination: { limit, hasMore, nextCursor } }
 */
exports.getUnreadList = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const cursor = decodeCursor(req.query.cursor);

    const db = getConnection(process.env.DB_TYPE);

    const params = [userId, limit + 1];
    let cursorClause = '';

    if (cursor?.id != null) {
      cursorClause = `AND id < $3`;
      params.push(cursor.id);
    }

    const sql = `
      SELECT
        id,
        subject,
        message,
        read,
        status
      FROM notification
      WHERE user_id = $1
        AND read = false
        AND status = 'ACTIVE'
        ${cursorClause}
      ORDER BY id DESC
      LIMIT $2
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
    console.error('Error in notificationController_sql.getUnreadList:', err);
    return res.status(500).json({ message: 'Server error loading notifications' });
  }
};
