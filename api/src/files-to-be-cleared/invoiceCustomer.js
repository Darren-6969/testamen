const router = require('express').Router();
const userCtrl = require('../controllers/invoicecustomerController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/users/usernames
router.post('/', verifyToken, userCtrl.getInvoiceCustomer);
router.post('/yearly-summary', verifyToken, userCtrl.getYearlyInvoiceSummary);
router.get('/yearly/:year', verifyToken, userCtrl.getInvoicesByYear);

module.exports = router;

