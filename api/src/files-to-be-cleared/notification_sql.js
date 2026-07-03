const router = require('express').Router();
const ctrl = require('../controllers/notificationController_sql');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/sql/notifications/unread?limit=20&cursor=...
router.get('/unread', verifyToken, ctrl.getUnreadList);

module.exports = router;
