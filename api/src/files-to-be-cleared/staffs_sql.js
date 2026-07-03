const router = require('express').Router();
const ctrl = require('../controllers/staffController_sql');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/sql/staffs?limit=20&cursor=...
router.get('/', verifyToken, ctrl.getStaffs);

module.exports = router;
