const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getUserModuleAccess,getUserSubmoduleAccess,getFullModuleList } = require('../controllers/accessController');

router.post('/user-sub-access', verifyToken,getUserSubmoduleAccess);
router.post('/user-access', verifyToken,getUserModuleAccess);
router.post('/modules', verifyToken, getFullModuleList);

module.exports = router;
