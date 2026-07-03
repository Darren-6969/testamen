const router = require('express').Router();
const ctrl = require('../controllers/activationController_sql');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/sql/activations?limit=20&cursor=...
router.get('/', verifyToken, ctrl.getActivations);

module.exports = router;
