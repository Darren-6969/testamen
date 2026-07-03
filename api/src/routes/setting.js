// routes/setting.js
const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/settingController');

// PROFILE
router.get('/profile', verifyToken, ctrl.getMyProfile);
router.put('/profile', verifyToken, ctrl.updateMyProfile);

// PASSWORD
router.put('/password', verifyToken, ctrl.updateMyPassword);

// ROLES & ROLE MODULE ACCESS
router.get('/roles', verifyToken, ctrl.getRoles);
router.get('/roles/:roleId/modules', verifyToken, ctrl.getRoleModules);
router.put('/roles/:roleId/modules', verifyToken, ctrl.updateRoleModules);

// // PRESET – module / role / access (examples)
// router.get('/preset/modules', verifyToken, ctrl.getModulePresets);
// router.put('/preset/modules', verifyToken, ctrl.updateModulePresets);

// router.get('/preset/roles', verifyToken, ctrl.getRolePresets);
// router.put('/preset/roles', verifyToken, ctrl.updateRolePresets);

// router.get('/preset/role-access', verifyToken, ctrl.getRoleAccessPresets);
// router.put('/preset/role-access', verifyToken, ctrl.updateRoleAccessPresets);

module.exports = router;
