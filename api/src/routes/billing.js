// src/routes/billing.js
const router = require('express').Router();
const ctrl = require('../controllers/billingController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/list', verifyToken, ctrl.getBilling);
router.get('/:id', verifyToken, ctrl.getBillingById);
router.post('/', verifyToken, ctrl.createBilling);
router.put('/:id', verifyToken, ctrl.updateBilling);
router.delete('/:id', verifyToken, ctrl.deleteBilling);
router.patch('/:id/restore', verifyToken, ctrl.restoreBilling);

module.exports = router;