const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

// Fetch all packages (list view)
router.post('/', verifyToken, ctrl.getServiceData);

router.post('/new-customers-monthly', verifyToken, ctrl.getNewCustomersMonthly);

router.post('/new-customers-latest', verifyToken, ctrl.getLatestNewCustomers);

router.post('/summary', verifyToken, ctrl.getDashboardSummary);

router.post('/installation-status', verifyToken, ctrl.getInstallationStatus);

router.post('/pending-payments', verifyToken, ctrl.getPendingPaymentsList);

module.exports = router;