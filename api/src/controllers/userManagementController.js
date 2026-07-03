const { getConnection, runQuery } = require('../db/connectionManager');

/**
 * GET /api/user-management
 * Fetch roles, admin accounts and modules
 */
const getUserManagementData = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const rolesSql = `
      SELECT
        id,
        name,
        description
      FROM public.mt_roles
      ORDER BY id ASC
    `;

    const adminsSql = `
      SELECT
        a.id,
        a.email,
        a.role_id,
        a.status,
        r.name AS role_name
      FROM public.mt_admin_account a
      LEFT JOIN public.mt_roles r ON r.id = a.role_id
      ORDER BY a.id ASC
    `;

    const modulesSql = `
      SELECT
        id,
        name,
        slug
      FROM public.mt_modules
      ORDER BY id ASC
    `;

    const roles = await runQuery(db, rolesSql);
    const admins = await runQuery(db, adminsSql);
    const modules = await runQuery(db, modulesSql);

    return res.status(200).json({
      success: true,
      message: 'User management data fetched successfully.',
      data: {
        roles,
        admins,
        modules,
      },
    });
  } catch (error) {
    console.error('getUserManagementData error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user management data.',
      error: error.message,
    });
  }
};

/**
 * POST /api/user-management/roles
 * Add new role
 */
const createRole = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Role name is required.',
    });
  }

  try {
    const sql = `
      INSERT INTO public.mt_roles (
        name,
        description
      )
      VALUES ($1, $2)
      RETURNING
        id,
        name,
        description
    `;

    const rows = await runQuery(db, sql, [
      name.trim(),
      description || null,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Role created successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('createRole error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create role.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/user-management/roles/:id
 * Update role
 */
const updateRole = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Role name is required.',
    });
  }

  try {
    const sql = `
      UPDATE public.mt_roles
      SET
        name = $1,
        description = $2
      WHERE id = $3
      RETURNING
        id,
        name,
        description
    `;

    const rows = await runQuery(db, sql, [
      name.trim(),
      description || null,
      id,
    ]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('updateRole error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update role.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/user-management/roles/:id
 * Delete role
 */
const deleteRole = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  if (Number(id) === 1) {
    return res.status(400).json({
      success: false,
      message: 'Super Admin role cannot be deleted.',
    });
  }

  try {
    const checkAdminSql = `
      SELECT COUNT(*)::int AS total
      FROM public.mt_admin_account
      WHERE role_id = $1
    `;

    const adminCheck = await runQuery(db, checkAdminSql, [id]);

    if (adminCheck[0]?.total > 0) {
      return res.status(400).json({
        success: false,
        message: 'This role is assigned to admin accounts and cannot be deleted.',
      });
    }

    const deletePermissionSql = `
      DELETE FROM public.mt_role_module_access
      WHERE role_id = $1
    `;

    await runQuery(db, deletePermissionSql, [id]);

    const deleteRoleSql = `
      DELETE FROM public.mt_roles
      WHERE id = $1
      RETURNING id
    `;

    const rows = await runQuery(db, deleteRoleSql, [id]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Role deleted successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('deleteRole error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete role.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/user-management/admin-roles
 * Update admin role and status
 */
const updateAdminRoles = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { admins } = req.body;

  if (!Array.isArray(admins)) {
    return res.status(400).json({
      success: false,
      message: 'Admins payload must be an array.',
    });
  }

  try {
    for (const admin of admins) {
      const { id, role_id, status } = admin;

      if (!id || !role_id) {
        continue;
      }

      const normalizedStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

      const sql = `
        UPDATE public.mt_admin_account
        SET
          role_id = $1,
          status = $2
        WHERE id = $3
      `;

      await runQuery(db, sql, [
        role_id,
        normalizedStatus,
        id,
      ]);
    }

    return res.status(200).json({
      success: true,
      message: 'Admin roles and status updated successfully.',
    });
  } catch (error) {
    console.error('updateAdminRoles error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update admin roles.',
      error: error.message,
    });
  }
};

/**
 * GET /api/user-management/roles/:id/permissions
 * Fetch role permissions
 */
const getRolePermissions = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  try {
    const sql = `
      SELECT
        role_id,
        module_id,
        can_view,
        can_edit
      FROM public.mt_role_module_access
      WHERE role_id = $1
      ORDER BY module_id ASC
    `;

    const rows = await runQuery(db, sql, [id]);

    return res.status(200).json({
      success: true,
      message: 'Role permissions fetched successfully.',
      data: rows,
    });
  } catch (error) {
    console.error('getRolePermissions error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch role permissions.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/user-management/roles/:id/permissions
 * Update role permissions
 */
const updateRolePermissions = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;
  const { permissions } = req.body;

  if (!Array.isArray(permissions)) {
    return res.status(400).json({
      success: false,
      message: 'Permissions payload must be an array.',
    });
  }

  try {
    const deleteSql = `
      DELETE FROM public.mt_role_module_access
      WHERE role_id = $1
    `;

    await runQuery(db, deleteSql, [id]);

    for (const permission of permissions) {
      const moduleId = permission.module_id;
      const canView = permission.can_view ? 1 : 0;
      const canEdit = permission.can_edit ? 1 : 0;

      if (!moduleId) {
        continue;
      }

      const insertSql = `
        INSERT INTO public.mt_role_module_access (
          role_id,
          module_id,
          can_view,
          can_edit
        )
        VALUES ($1, $2, $3, $4)
      `;

      await runQuery(db, insertSql, [
        id,
        moduleId,
        canView,
        canEdit,
      ]);
    }

    return res.status(200).json({
      success: true,
      message: 'Role permissions updated successfully.',
    });
  } catch (error) {
    console.error('updateRolePermissions error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update role permissions.',
      error: error.message,
    });
  }
};

module.exports = {
  getUserManagementData,
  createRole,
  updateRole,
  deleteRole,
  updateAdminRoles,
  getRolePermissions,
  updateRolePermissions,
};