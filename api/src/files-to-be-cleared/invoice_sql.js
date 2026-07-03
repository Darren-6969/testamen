const router = require('express').Router();
const ctrl = require('../controllers/invoiceController_sql');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/sql/invoices?limit=20&cursor=...
router.get('/', verifyToken, ctrl.getAllInvoices);

// GET /api/sql/invoices/:docno
router.get('/:docno', verifyToken, ctrl.getInvoiceByCode);

// GET /api/sql/invoices/customer/:code?limit=20&cursor=...
router.get('/customer/:code', verifyToken, ctrl.getOpenInvoicesByCustomer);

module.exports = router;
