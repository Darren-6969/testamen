const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword } = require('../utils/hashUtils');
const { logAudit, diffObjects, resolveActor } = require("../utils/audit");

function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function decodeCursor(str) {
  try {
    return JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}


// ============================================================================
//                       Get All Users
// ============================================================================
// This function fetches user data from whichever database is enabled:
//   - MySQL / Postgres: SELECT query with optional JOIN to user_role
//   - MongoDB: uses Mongoose find() with projection
// It supports field selection via JSON input in req.body:
// Example input: {"fields": ["users.id", "name", "email", "user_role.role_name","acc_status AS status"]}
// ============================================================================
exports.getStaffs = async (req, res, next) => {
  try {
    // Extract requested fields
    const { fields } = req.body || {};
    let fieldList;

    if (Array.isArray(fields) && fields.length > 0) {
      // Prevent SQL injection by sanitizing column names:
      // - allow letters, numbers, underscore, dot, and space (for aliases)
      fieldList = fields
        .map(f => f.replace(/[^a-zA-Z0-9_\. ]/g, ''))
        .join(', ');
    }

    // Default query (all columns + join with user_role)
    const defaultQuery = `SELECT * FROM users LEFT JOIN user_role ON users.role_id = user_role.id WHERE users.status_id = 1`;

    // Query with selected fields if provided
    const queryWithCond = `SELECT ${fieldList} FROM users LEFT JOIN user_role ON users.role_id = user_role.id WHERE users.status_id = 1`;

    // ------------------------------------------------------------------------
    // Run Query
    // ------------------------------------------------------------------------
    try {
      const db = getConnection(process.env.DB_TYPE); // e.g. "mysql" or "postgres"
      const query = fieldList ? queryWithCond : defaultQuery;
      let rows = await runQuery(db, query);
      return res.json(rows);
    } catch (error) {
        console.error(err);
        res.status(500).json({ message: 'Failed to retrieve results' });
    }


    // ------------------------------------------------------------------------
    // No Database Configured
    // ------------------------------------------------------------------------
    return res.status(500).json({ error: 'No database configured.' });
  } catch (err) {
    next(err);
  }
};

exports.getStaffsCursor = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const cursor = decodeCursor(req.query.cursor);

    const nameSearch = req.query.name || '';
    const emailSearch = req.query.email || '';
    const roleSearch = req.query.role || '';
    const statusSearch = req.query.status || '';

    const db = getConnection(process.env.DB_TYPE);

    const params = [limit + 1, nameSearch, emailSearch, roleSearch, statusSearch];
    let cursorClause = '';

    if (cursor?.id != null) {
      params.push(cursor.id);
      cursorClause = `AND users.id < $${params.length}`;
    }

    const sql = `
      SELECT
        users.id,
        users.name,
        users.email,
        users.username,
        users.acc_status AS status,
        user_role.role_name AS role
      FROM users
      LEFT JOIN user_role ON users.role_id = user_role.id
      WHERE users.status_id = 1
        AND ($2 = '' OR users.name ILIKE '%' || $2 || '%')
        AND ($3 = '' OR users.email ILIKE '%' || $3 || '%')
        AND ($4 = '' OR user_role.role_name ILIKE '%' || $4 || '%')
        AND ($5 = '' OR users.acc_status = $5)
        ${cursorClause}
      ORDER BY users.id DESC
      LIMIT $1
    `;

    const rows = await runQuery(db, sql, params);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const last = data[data.length - 1];

    return res.json({
      data,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore && last ? encodeCursor({ id: last.id }) : null,
      },
    });
  } catch (err) {
    console.error('Error in staffController.getStaffsCursor:', err);
    next(err);
  }
};

exports.getTechnicianList = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const query = `SELECT users.id, users.name 
                    FROM users 
                    LEFT JOIN user_role ON users.role_id = user_role.id 
                    WHERE user_role.role_name = 'Technician' 
                    AND users.status_id = 1`;
    const rows = await runQuery(db, query);
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching technician list:', err);
    next(err);
  }
};

// ============================================================================
//                       Get User Modules & Submodules
// ============================================================================
exports.getUserModules = async (req, res, next) => {
  try {
    const userId = req.user.userId; // middleware should populate req.user

    let rows;

    try {
      const db = getConnection(process.env.DB_TYPE); // e.g. "mysql" or "postgres"
      const query =`SELECT m.id as module_id, m.icon, m.display_name as label, m.url as href,
              s.id as submodule_id,  s.display_name as sub_label, s.url as sub_href
              FROM module m
              LEFT JOIN submodule s ON s.module_id = m.id
              INNER JOIN user_module_access uma 
                  ON uma.module_id = m.id AND uma.user_id = $1 AND uma.access = 1
              ORDER BY m.id, s.id`;
      rows = await runQuery(db, query, [userId]);
    } catch (error) {
      console.error(err);
      res.status(500).json({ error: 'No SQL database configured' });
    }
      

    // ------------------------------------------------------------------------
    // Convert flat resultset → nested JSON
    // ------------------------------------------------------------------------
    const modulesMap = {};
    for (const row of rows) {
      if (!modulesMap[row.module_id]) {
        modulesMap[row.module_id] = {
          icon: row.icon,
          label: row.label,
          href: row.href,
          submodule: []
        };
      }

      if (row.submodule_id) {
        modulesMap[row.module_id].submodule.push({
          label: row.sub_label,
          href: row.sub_href
        });
      }
    }

    const result = Object.values(modulesMap);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============================================================================
//                       Get Single Staff by ID
// ============================================================================
// Returns detailed info for one staff record by ID.
// Works for both SQL (MySQL/Postgres) and MongoDB.
// ============================================================================
exports.getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
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
    `;

    const rows = await runQuery(db, query, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching staff by ID:', err);
    next(err);
  }
};

// ============================================================================
//                       Update Staff by ID
// ============================================================================
// Allows updating staff details (name, email, role, phone, etc.)
// ============================================================================

exports.updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, username, status, role, phone } = req.body;

    const db = getConnection(process.env.DB_TYPE);

    // ✅ FIXED: actor resolve (works even if req.user is missing)
    const { actorUserId, actorUsername } = await resolveActor(req, db);

    // ✅ request metadata
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    const snapshotQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.username,
        u.acc_status,
        ur.role_name AS role,
        s.phone
      FROM users u
      LEFT JOIN user_role ur ON u.role_id = ur.id
      LEFT JOIN staff s ON s.user_id = u.id
      WHERE u.id = $1
    `;

    // 1) BEFORE
    const beforeRows = await runQuery(db, snapshotQuery, [id]);
    if (!beforeRows?.length) {
      return res.status(404).json({ message: "Staff not found" });
    }
    const before = beforeRows[0];

    // 2) Update users
    const updateUserQuery = `
      UPDATE users
      SET name = $1,
          email = $2,
          username = $3,
          acc_status = $4,
          role_id = (SELECT id FROM user_role WHERE role_name = $5 LIMIT 1)
      WHERE id = $6
    `;
    await runQuery(db, updateUserQuery, [name, email, username, status, role, id]);

    // 3) Update staff phone (allow empty string too)
    if (phone !== undefined) {
      const updateStaffQuery = `
        UPDATE staff
        SET phone = $1
        WHERE user_id = $2
      `;
      await runQuery(db, updateStaffQuery, [phone, id]);
    }

    // 4) AFTER
    const afterRows = await runQuery(db, snapshotQuery, [id]);
    const after = afterRows?.[0] ?? null;

    // 5) Diff + log only if changed
    const changed_fields = diffObjects(before, after);

    if (changed_fields && Object.keys(changed_fields).length > 0) {
      await logAudit(db, {
        actor_user_id: actorUserId,
        actor_username: actorUsername,
        action: "UPDATE",
        entity_table: "users",
        entity_id: String(id),
        module: "People",
        endpoint: `${req.method} ${req.originalUrl}`,
        description: `Updated staff user_id=${id}`,
        before_data: before,
        after_data: after,
        changed_fields,
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return res.json({
      message: "Staff updated successfully.",
      changed: Object.keys(changed_fields || {}).length,
      // optional debug:
      // actor: { actorUserId, actorUsername }
    });
  } catch (err) {
    console.error("Error updating staff:", err);
    next(err);
  }
};


exports.createStaff = async (req, res) => {
  try {
    // ✅ accept BOTH old + new payload keys
    const username = req.body.username;
    const email = req.body.email;

    const staffName = req.body.staffName ?? req.body.name;      // ✅ fallback to "name"
    const contact = req.body.contact ?? req.body.phone;         // ✅ fallback to "phone"

    const status = req.body.status;
    const role = req.body.role;
    const password = req.body.password;

    // ✅ basic validation (avoid NULL inserts)
    if (!username || !staffName || !status || !role || !password) {
      return res.status(400).json({
        message: "Missing required fields",
        missing: {
          username: !username,
          name_or_staffName: !staffName,
          status: !status,
          role: !role,
          password: !password,
        },
      });
    }

    const db = getConnection(process.env.DB_TYPE);

    // ✅ actor (middleware OR fallback token decode)
    const { actorUserId, actorUsername } = await resolveActor(req, db);

    // ✅ request metadata
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    console.log("🧾 Received staff data:", req.body);

    const hashed = await hashPassword(password);

    // 1️⃣ Insert into users table
    const insertUserQuery = `
      INSERT INTO users (username, email, name, acc_status, role_id, password, created_at, status_id)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), 1)
      RETURNING id
    `;
    const userResult = await runQuery(db, insertUserQuery, [
      username,
      email ?? null,
      staffName,       // ✅ uses resolved name
      status,
      Number(role),    // ✅ ensure number
      hashed,
    ]);

    const userId = userResult[0].id;

    // 2️⃣ Insert into staff table
    const insertStaffQuery = `
      INSERT INTO staff (user_id, phone, status)
      VALUES ($1, $2, 'ACTIVE')
    `;
    await runQuery(db, insertStaffQuery, [userId, contact ?? null]); // ✅ uses resolved phone

    // ✅ AFTER snapshot (for audit)
    const snapshotQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.username,
        u.acc_status,
        ur.role_name AS role,
        s.phone
      FROM users u
      LEFT JOIN user_role ur ON u.role_id = ur.id
      LEFT JOIN staff s ON s.user_id = u.id
      WHERE u.id = $1
    `;
    const afterRows = await runQuery(db, snapshotQuery, [userId]);
    const after = afterRows?.[0] ?? null;

    // ✅ Audit: CREATE
    await logAudit(db, {
      actor_user_id: actorUserId,
      actor_username: actorUsername,
      action: "CREATE",
      entity_table: "users",
      entity_id: String(userId),
      module: "People",
      endpoint: `${req.method} ${req.originalUrl}`,
      description: `Created staff user_id=${userId}`,
      before_data: null,
      after_data: after,
      changed_fields: after ? diffObjects({}, after) : null,
      ip_address: ip,
      user_agent: userAgent,
    });

    return res.status(201).json({
      message: "Staff added successfully",
      userId,
    });
  } catch (err) {
    console.error("❌ Error adding staff:", err);
    return res.status(500).json({ message: "Failed to add staff", error: err.message });
  }
};


// staffController.js
exports.updateStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "Inactive" / "Active"

    if (!status) return res.status(400).json({ message: "status is required" });

    const db = getConnection(process.env.DB_TYPE);

    // ✅ actor
    const { actorUserId, actorUsername } = await resolveActor(req, db);

    // ✅ metadata
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    // BEFORE
    const beforeRows = await runQuery(
      db,
      `SELECT id, username, acc_status FROM users WHERE id = $1`,
      [id]
    );
    if (!beforeRows?.length) return res.status(404).json({ message: "Staff not found" });
    const before = beforeRows[0];

    // UPDATE
    await runQuery(db, `UPDATE users SET acc_status = $1 WHERE id = $2`, [status, id]);

    // AFTER
    const afterRows = await runQuery(
      db,
      `SELECT id, username, acc_status FROM users WHERE id = $1`,
      [id]
    );
    const after = afterRows?.[0] ?? null;

    // Audit only if changed
    const changed_fields = diffObjects(before, after);
    if (Object.keys(changed_fields).length > 0) {
      await logAudit(db, {
        actor_user_id: actorUserId,
        actor_username: actorUsername,
        action: "DELETE",
        entity_table: "users",
        entity_id: String(id),
        module: "People",
        endpoint: `${req.method} ${req.originalUrl}`,
        description: `Soft-deleted staff user_id=${id}`,
        before_data: before,
        after_data: after,
        changed_fields,
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return res.json({ message: "Staff status updated.", id, status });
  } catch (err) {
    console.error("Error updating staff status:", err);
    next(err);
  }
};

// ============================================================================
//                       Delete (Soft) Staff
// ============================================================================
exports.deleteStaff = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid staff id" });
    }

    const db = getConnection(process.env.DB_TYPE);

    // ✅ actor
    const { actorUserId, actorUsername } = await resolveActor(req, db);

    // ✅ metadata
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    // BEFORE
    const beforeRows = await runQuery(
      db,
      `SELECT id, username, acc_status, status_id FROM users WHERE id = $1`,
      [id]
    );
    if (!beforeRows?.length) return res.status(404).json({ message: "Staff not found" });
    const before = beforeRows[0];

    // ✅ Soft delete (match your getStaffs WHERE status_id = 1)
    const updateQuery = `
      UPDATE users
      SET acc_status = 'Inactive'
      WHERE id = $1
      AND status_id = 1
    `;
    const result = await runQuery(db, updateQuery, [id]);

    // AFTER
    const afterRows = await runQuery(
      db,
      `SELECT id, username, acc_status, status_id FROM users WHERE id = $1`,
      [id]
    );
    const after = afterRows?.[0] ?? null;

    // Audit if changed
    const changed_fields = diffObjects(before, after);
    if (changed_fields && Object.keys(changed_fields).length > 0) {
      await logAudit(db, {
        actor_user_id: actorUserId,
        actor_username: actorUsername,
        action: "DELETE",
        entity_table: "users",
        entity_id: String(id),
        module: "People",
        endpoint: `${req.method} ${req.originalUrl}`,
        description: `Soft-deleted staff user_id=${id}`,
        before_data: before,
        after_data: after,
        changed_fields,
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return res.json({ message: "Staff deactivated (soft deleted).", id });
  } catch (err) {
    console.error("Error deleting staff:", err);
    next(err);
  }
};
