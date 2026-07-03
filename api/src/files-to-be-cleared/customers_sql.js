const router = require('express').Router();
const ctrl = require('../controllers/customerController_sql');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/sql/customers?limit=20&cursor=...
router.get('/', verifyToken, ctrl.getCustomers);

module.exports = router;
