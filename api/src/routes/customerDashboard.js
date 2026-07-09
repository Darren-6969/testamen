const router = require('express').Router();
const ctrl = require('../controllers/customerDashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/overview', verifyToken, ctrl.getOverview);

module.exports = router;