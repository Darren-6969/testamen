// controllers/settingController.js
const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword, comparePassword } = require('../utils/hashUtils');

// helper: get current logged-in user id from verifyToken / session
function getCurrentUserId(req) {
  // decoded from JWT – payload has { userId, username }
  if (req.user && req.user.id) return req.user.id;
  if (req.user && req.user.userId) return req.user.userId;   // 👈 this one is for your login payload
  if (req.user && req.user.user_id) return req.user.user_id;
  if (req.session && req.session.user && req.session.user.id) {
    return req.session.user.id;
  }
  return null;
}

// ================= PROFILE =================
exports.getMyProfile = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    console.log('[getMyProfile] userId:', userId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const db = getConnection(process.env.DB_TYPE);

    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.username,
        u.acc_status AS status,
        ur.role_name AS role,
        s.phone AS phone
      FROM users u
      LEFT JOIN user_role ur ON u.role_id = ur.id
      LEFT JOIN staff s ON s.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
    `;

    const rows = await runQuery(db, query, [userId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[getMyProfile] result:', rows[0]);
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error in getMyProfile:', err);
    return res.status(500).json({ message: 'Server error loading profile' });
  }
};

exports.updateMyProfile = async (req, res) => {
  console.log('[updateMyProfile] body:', req.body);

  try {
    const userId = getCurrentUserId(req);
    console.log('[updateMyProfile] userId:', userId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const { name, phone } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const db = getConnection(process.env.DB_TYPE);

    // 1) Update name in users
    const updateUserSql = `
      UPDATE users
      SET name = $1
      WHERE id = $2
    `;
    await runQuery(db, updateUserSql, [name.trim(), userId]);

    // 2) Update phone in staff if provided
    if (phone && phone.trim()) {
      const updateStaffSql = `
        UPDATE staff
        SET phone = $1
        WHERE user_id = $2
      `;
      await runQuery(db, updateStaffSql, [phone.trim(), userId]);
    }

    console.log('[updateMyProfile] updated successfully for user', userId);
    return res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error in updateMyProfile:', err);
    return res.status(500).json({ message: 'Server error updating profile' });
  }
};

// ================= PASSWORD =================
exports.updateMyPassword = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const { currentPassword, newPassword } = req.body || {};

    // Basic validation
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: 'New password must be at least 6 characters long' });
    }

    const db = getConnection(process.env.DB_TYPE);

    // 1) Get existing password hash from DB
    const selectSql = `
      SELECT password
      FROM users
      WHERE id = $1
      LIMIT 1
    `;
    const rows = await runQuery(db, selectSql, [userId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // 2) Verify current password using your helper
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: 'Current password is incorrect' });
    }

    // 3) Hash new password with your helper
    const newHash = await hashPassword(newPassword);

    // 4) Save new hashed password
    const updateSql = `
      UPDATE users
      SET password = $1
      WHERE id = $2
    `;
    await runQuery(db, updateSql, [newHash, userId]);

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    console.error('Error in updateMyPassword:', err);
    return res
      .status(500)
      .json({ message: 'Server error updating password' });
  }
};


// ================= ROLES =================
/**
 * GET /setting/roles
 * Returns list of roles (for Role list page)
 */
exports.getRoles = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      SELECT 
        id,
        role_name,
        status
      FROM user_role
      ORDER BY id
    `;

    const rows = await runQuery(db, sql, []);
    return res.json(rows || []);
  } catch (err) {
    console.error('Error in getRoles:', err);
    return res.status(500).json({ message: 'Server error loading roles' });
  }
};

/**
 * GET /setting/roles/:roleId/modules
 * Returns all modules with access flag for the given role.
 */
exports.getRoleModules = async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (!roleId || Number.isNaN(roleId)) {
      return res.status(400).json({ message: 'Invalid role ID' });
    }

    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      SELECT
        m.id AS module_id,
        m.display_name AS module_name,
        COALESCE(rma.view_access, false)   AS view_access,
        COALESCE(rma.create_access, false) AS create_access,
        COALESCE(rma.update_access, false) AS update_access,
        COALESCE(rma.delete_access, false) AS delete_access
      FROM module m
      LEFT JOIN role_module_access rma
        ON rma.module_id = m.id
       AND rma.role_id = $1
      ORDER BY m.id
    `;

    const rows = await runQuery(db, sql, [roleId]);

    const result = (rows || []).map(row => ({
      module_id: row.module_id,
      module_name: row.module_name,
      view_access: row.view_access === true,
      create_access: row.create_access === true,
      update_access: row.update_access === true,
      delete_access: row.delete_access === true,
    }));

    return res.json(result);
  } catch (err) {
    console.error('Error in getRoleModules:', err);
    return res.status(500).json({ message: 'Server error loading role modules' });
  }
};

/**
 * PUT /setting/roles/:roleId/modules
 * Body: { modules: [{ module_id, access, ... }, ...] }
 * We clear existing access for that role and re-insert rows with boolean view_access.
 */
exports.updateRoleModules = async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (!roleId || Number.isNaN(roleId)) {
      return res.status(400).json({ message: 'Invalid role ID' });
    }

    const { modules } = req.body || {};
    if (!Array.isArray(modules)) {
      return res.status(400).json({ message: 'Modules payload is required' });
    }

    const db = getConnection(process.env.DB_TYPE);

    // 1) Clear existing access for this role
    const deleteSql = `
      DELETE FROM role_module_access
      WHERE role_id = $1
    `;
    await runQuery(db, deleteSql, [roleId]);

    // 2) Insert one row per module with boolean flags
    const insertSql = `
      INSERT INTO role_module_access (
        role_id,
        module_id,
        view_access,
        create_access,
        update_access,
        delete_access
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const mod of modules) {
      if (!mod || !mod.module_id) continue;

      const view_access   = !!mod.view_access;
      const create_access = !!mod.create_access;
      const update_access = !!mod.update_access;
      const delete_access = !!mod.delete_access;

      await runQuery(db, insertSql, [
        roleId,
        mod.module_id,
        view_access,
        create_access,
        update_access,
        delete_access,
      ]);
    }

    return res.json({
      success: true,
      message: 'Role module access updated successfully',
    });
  } catch (err) {
    console.error('Error in updateRoleModules:', err);
    return res
      .status(500)
      .json({ message: 'Server error updating role modules' });
  }
};



// // ================= PRESETS ==================
// exports.getModulePresets = async (req, res, next) => { /* ... */ };
// exports.updateModulePresets = async (req, res, next) => { /* ... */ };

// exports.getRolePresets = async (req, res, next) => { /* ... */ };
// exports.updateRolePresets = async (req, res, next) => { /* ... */ };

// exports.getRoleAccessPresets = async (req, res, next) => { /* ... */ };
// exports.updateRoleAccessPresets = async (req, res, next) => { /* ... */ };
