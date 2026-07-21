const router = require("express").Router();
const ctrl = require("../controllers/registrationController");
const { verifyToken } = require("../middleware/authMiddleware");

console.log('ctrl keys:', Object.keys(ctrl));

router.post('/public/register', ctrl.publicRegister);
router.get('/list', verifyToken, ctrl.getAllRegistrations);
router.get('/:id', verifyToken, ctrl.getRegistration);
router.put('/:id', verifyToken, ctrl.updateRegistration);
router.delete('/:id', verifyToken, ctrl.deleteRegistration);


module.exports = router;