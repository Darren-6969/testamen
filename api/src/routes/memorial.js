// src/routes/memorial.js
const router = require('express').Router();
const ctrl = require('../controllers/memorialController');
const { verifyToken } = require('../middleware/authMiddleware');

// List the current customer's memorials (for the shared module header)
router.get('/', verifyToken, ctrl.listMemorials);

module.exports = router;