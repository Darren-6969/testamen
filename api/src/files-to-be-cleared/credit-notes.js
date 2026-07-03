const router = require('express').Router();
const ctrl   = require('../controllers/creditNoteController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, ctrl.getAllCreditNotes);
// router.get('/newInvoice', verifyToken, ctrl.newInvoice);
// router.get('/:id', ctrl.getUserById);
// router.post('/',   ctrl.createUser);
// router.put('/:id', ctrl.updateUser);
// router.delete('/:id', ctrl.deleteUser);

module.exports = router;
