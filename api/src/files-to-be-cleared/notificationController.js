// controllers/notificationController.js
const { getConnection, runQuery } = require('../db/connectionManager');

// Reuse same pattern as settingController:
function getCurrentUserId(req) {
  if (req.user && req.user.id) return req.user.id;
  if (req.user && req.user.userId) return req.user.userId;
  if (req.user && req.user.user_id) return req.user.user_id;
  if (req.session && req.session.user && req.session.user.id) {
    return req.session.user.id;
  }
  return null;
}

/**
 * GET /api/notifications/unread-count
 * Returns: { count: number }
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      SELECT COUNT(*) AS cnt
      FROM notification
      WHERE user_id = $1
        AND read = false
        AND status = 'ACTIVE'
    `;

    const rows = await runQuery(db, sql, [userId]);
    const count = rows && rows[0] ? Number(rows[0].cnt) : 0;

    return res.json({ count });
  } catch (err) {
    console.error('Error in getUnreadCount:', err);
    return res
      .status(500)
      .json({ message: 'Server error loading notification count' });
  }
};

/**
 * GET /api/notifications/unread
 * Returns: [{ id, subject, message, read, status }, ...]
 */
exports.getUnreadList = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const db = getConnection(process.env.DB_TYPE);

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
      ORDER BY id DESC
    `;

    const rows = await runQuery(db, sql, [userId]);
    return res.json(rows || []);
  } catch (err) {
    console.error('Error in getUnreadList:', err);
    return res
      .status(500)
      .json({ message: 'Server error loading notifications' });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Marks a single notification as read for the current user.
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const notifId = parseInt(req.params.id, 10);
    if (!notifId || Number.isNaN(notifId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      UPDATE notification
      SET read = true
      WHERE id = $1
        AND user_id = $2
    `;

    await runQuery(db, sql, [notifId, userId]);

    return res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (err) {
    console.error('Error in markAsRead:', err);
    return res
      .status(500)
      .json({ message: 'Server error updating notification' });
  }
};