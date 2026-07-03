const router = require('express').Router();
const ctrl   = require('../controllers/branchCustomerCountController');
// const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', ctrl.getAllBranchCustomerCounts);

module.exports = router;