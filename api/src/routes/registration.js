const router = require("express").Router();
const ctrl = require("../controllers/registrationController");
const { verifyToken } = require("../middleware/authMiddleware");

console.log('ctrl keys:', Object.keys(ctrl));

router.get('/list', verifyToken, ctrl.getAllRegistrations);
router.get('/:id', verifyToken, ctrl.getRegistration);
router.delete('/:id', verifyToken, ctrl.deleteRegistration);


module.exports = router;