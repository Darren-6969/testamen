// src/routes/feedback.js
const router = require("express").Router();
const ctrl = require("../controllers/feedbackController");
const { verifyToken } = require("../middleware/authMiddleware");


router.get('/list', verifyToken, ctrl.getFeedback);
router.get('/:id', verifyToken, ctrl.getFeedbackById);
router.post('/', verifyToken, ctrl.createFeedback);
router.put('/:id', verifyToken, ctrl.updateFeedback);
router.delete('/:id', verifyToken, ctrl.deleteFeedback);


module.exports = router;