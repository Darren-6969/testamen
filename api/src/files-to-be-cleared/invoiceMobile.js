const router = require('express').Router();
const ctrl   = require('../controllers/invoiceMobileController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, ctrl.getAllInvoices2);

// ✅ new simple outstanding endpoint (secure)
router.get('/outstanding/:code', verifyToken, ctrl.getOutstandingFromArIvByCustomer);

router.get('/customer/:code', ctrl.getOpenInvoicesByCustomer);
router.get("/open/:code", verifyToken, ctrl.getOpenInvoicesByCustomer);

router.get('/:docno', ctrl.getInvoiceByCode2);

module.exports = router;