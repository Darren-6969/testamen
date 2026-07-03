const router = require('express').Router();
const ctrl   = require('../controllers/invoiceController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, ctrl.getAllInvoices);
router.get('/:docno', ctrl.getInvoiceByCode);
// router.get('/knockoff/:docno', verifyToken, ctrl.getKnockoffByInvoice);
router.get('/customer/:code', ctrl.getOpenInvoicesByCustomer);
router.get('/customer/totalInvoiceAmount/:code', verifyToken, ctrl.getCustomerTotalInvoiceAmount);
router.get('/pdf/:docno', verifyToken, ctrl.getBillDetails);
router.get('/knockoff/:code', verifyToken, ctrl.getAllCustomerKnockoffs);

module.exports = router;
