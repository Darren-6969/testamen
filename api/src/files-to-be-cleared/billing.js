const router = require('express').Router();
const invctrl   = require('../controllers/invoiceController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, invctrl.getAllInvoices);
router.get('/:docno', invctrl.getInvoiceByCode);
// router.get('/knockoff/:docno', verifyToken, invctrl.getKnockoffByInvoice);
router.get('/customer/:code', invctrl.getOpenInvoicesByCustomer);
router.get('/customer/totalInvoiceAmount/:code', verifyToken, invctrl.getCustomerTotalInvoiceAmount);
router.get('/pdf/:docno', verifyToken, invctrl.getBillDetails);
router.get('/knockoff/:code', verifyToken, invctrl.getAllCustomerKnockoffs);



module.exports = router;
