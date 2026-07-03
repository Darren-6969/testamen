const router = require('express').Router();
const ctrl   = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

// listing
// GET /api/sql/payments/all?limit=20&pending_cursor=...&completed_cursor=...
router.get('/all', verifyToken, ctrl.listAllPayments);
// GET /api/sql/payments/pending?limit=20&cursor=...
router.get('/pending', verifyToken, ctrl.listPendingPayments);
// GET /api/sql/payments/completed?limit=20&cursor=...
router.get('/completed', verifyToken, ctrl.listCompletedPayments);

// create
router.post('/add', verifyToken, ctrl.createPayment);

// update for pending payments only
router.put('/pending/:dockey', verifyToken, ctrl.updatePayment);

// update status for pending to completed
router.put('/status/:dockey', verifyToken, ctrl.updateStatusPayment);

// view
router.get('/pending/:dockey', verifyToken, ctrl.viewPendingPayment);
router.get('/completed/:dockey', verifyToken, ctrl.viewCompletedPayment);

// delete
router.delete('/:dockey', verifyToken, ctrl.deletePendingPayment);

module.exports = router;
