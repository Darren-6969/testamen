const router = require('express').Router();
const ctrl = require('../controllers/debitNoteController_sql');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/sql/debit-notes?limit=20&cursor=...
router.get('/', verifyToken, ctrl.getAllDebitNotes);

module.exports = router;
