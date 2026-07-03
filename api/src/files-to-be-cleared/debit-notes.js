const router = require('express').Router();
const ctrl   = require('../controllers/debitNoteController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, ctrl.getAllDebitNotes);
// router.get('/newInvoice', verifyToken, ctrl.newInvoice);
// router.get('/:id', ctrl.getUserById);
// router.post('/',   ctrl.createUser);
// router.put('/:id', ctrl.updateUser);
// router.delete('/:id', ctrl.deleteUser);

module.exports = router;
