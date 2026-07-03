const express = require('express');
const router = express.Router();

const {
  getUserManagementData,
  createRole,
  updateRole,
  deleteRole,
  updateAdminRoles,
  getRolePermissions,
  updateRolePermissions,
} = require('../controllers/userManagementController');

/**
 * User Management Routes
 */
router.get('/', getUserManagementData);

router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

router.put('/admin-roles', updateAdminRoles);

router.get('/roles/:id/permissions', getRolePermissions);
router.put('/roles/:id/permissions', updateRolePermissions);

module.exports = router;