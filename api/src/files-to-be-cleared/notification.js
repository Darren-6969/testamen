// src/routes/notification.js
const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');

// ⬅️ Make sure this path & name are correct
const notificationCtrl = require('../controllers/notificationController');

// unread count for current user
router.get('/unread-count', verifyToken, notificationCtrl.getUnreadCount);

// list of unread notifications for current user
router.get('/unread', verifyToken, notificationCtrl.getUnreadList);

// mark a single notification as read
router.put('/:id/read', verifyToken, notificationCtrl.markAsRead);

module.exports = router;
