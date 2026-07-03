// src/controllers/customersMobileController.js
const { getConnection, runQuery } = require("../db/connectionManager");
const fs = require("fs");
const path = require("path");

// const fs = require("fs");
// const path = require("path");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// supports old "file.pdf" and new "123/file.pdf"
function getCustomerFileAbsPath(dbValue) {
  if (!dbValue) return null;
  const baseDir = path.join(__dirname, "..", "uploads", "customers");
  if (dbValue.includes("/")) return path.join(baseDir, dbValue);
  return path.join(baseDir, dbValue);
}

// move uploaded tmp files into /uploads/customers/<userId>/
function moveTmpFilesToUserFolder(userId, reqFiles) {
  const baseDir = path.join(__dirname, "..", "uploads", "customers");
  const userDir = path.join(baseDir, String(userId));
  ensureDir(userDir);

  const out = {};
  for (const [field, arr] of Object.entries(reqFiles || {})) {
    const f = Array.isArray(arr) ? arr[0] : null;
    if (!f) {
      out[field] = null;
      continue;
    }

    const fromPath = f.path; // .../uploads/customers/tmp/xxx
    const filename = f.filename;
    const toPath = path.join(userDir, filename);

    try {
      fs.renameSync(fromPath, toPath);
      out[field] = `${userId}/${filename}`; // ✅ store "id/filename"
    } catch (e) {
      console.error("❌ move file error:", field, e);
      out[field] = null;
    }
  }

  return out;
}

// Normalize runQuery return shape (postgres returns rows; some mysql wrappers return [rows, fields])
const firstRow = (result) => {
  if (!result) return null;
  const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
  return rows?.[0] || null;
};

const allRows = (result) => {
  if (!result) return [];
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
};


const uploadsDir = path.join(__dirname, "..", "uploads", "customers");

const allowedFileFields = [
  "form_d_a",
  "form_d_b",
  "form_9_49",
  "form_13_49",
  "form_79_80_83",
  "file_latestbill",
  "file_other",
];

const isPostgres = () => (process.env.DB_TYPE || "").toLowerCase().includes("post");
const ph = (n) => (isPostgres() ? `$${n}` : "?");

// const getAffected = (result) =>
//   (result && (result.affectedRows ?? result.rowCount)) || 0;

const getAffected = (result) => {
  if (!result) return 0;

  // ✅ mysql2 / some wrappers return [ResultSetHeader, fields]
  if (Array.isArray(result)) result = result[0];

  return (result.affectedRows ?? result.rowCount) || 0;
};


// prevent accidental overwrite with "" (empty string)
const clean = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
};

// =========================
// Update my customer profile
// =========================
exports.updateMyCustomerProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId; // from verifyToken
    const db = getConnection(process.env.DB_TYPE);

    // update users.name
    const name = (req.body?.name || "").trim();
    if (name) {
      await runQuery(db, `UPDATE users SET name = ${ph(1)} WHERE id = ${ph(2)}`, [
        name,
        userId,
      ]);
    }

    // ------------------------------------------------------------
    // ✅ FILE handling:
    // 1) read current values
    // 2) move tmp -> /customers/<userId>/
    // 3) delete old file if replaced
    // ------------------------------------------------------------
    const fileFields = [...allowedFileFields];

    const currentFilesRes = await runQuery(
      db,
      `SELECT ${fileFields.join(", ")} FROM customer WHERE user_id = ${ph(1)} LIMIT 1`,
      [userId]
    );

    const currentFiles = firstRow(currentFilesRes) || {};

    // Build map of incoming files per field
    const incomingFilesMap = {};
    for (const f of fileFields) incomingFilesMap[f] = req.files?.[f];

    // Move newly uploaded tmp files into /uploads/customers/<userId>/
    const moved = moveTmpFilesToUserFolder(userId, incomingFilesMap);

    // If a new file uploaded, delete old file
    for (const field of fileFields) {
      if (moved[field]) {
        const oldValue = currentFiles[field]; // could be "old.pdf" OR "123/old.pdf"
        if (oldValue) {
          const oldPath = getCustomerFileAbsPath(oldValue);
          try {
            if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          } catch (e) {
            console.error(`Failed to delete old file for ${field}:`, e);
          }
        }
      }
    }

    // New DB values (null => keep old via COALESCE)
    const newFileValues = {};
    for (const field of fileFields) {
      newFileValues[field] = moved[field] || null;
    }

    // map body fields
    const phone = clean(req.body?.phone);
    const application_type = clean(req.body?.application_type);

    const company_address = clean(req.body?.company_address);
    const company_city = clean(req.body?.company_city);
    const company_postcode = clean(req.body?.company_postcode);
    const registration_num = clean(req.body?.registration_num);
    const company_fax = clean(req.body?.company_fax);

    const admin_title = clean(req.body?.admin_title);
    const admin_name = clean(req.body?.admin_name);
    const admin_address = clean(req.body?.admin_address);
    const admin_city = clean(req.body?.admin_city);
    const admin_postcode = clean(req.body?.admin_postcode);
    const admin_email = clean(req.body?.admin_email);
    const admin_contact = clean(req.body?.admin_contact);
    const admin_fax = clean(req.body?.admin_fax);

    const service_length = clean(req.body?.service_length)
      ? Number(req.body.service_length)
      : null;

    const signatory_name = clean(req.body?.signatory_name);
    const signatory_designation = clean(req.body?.signatory_designation);
    const signatory_icnum = clean(req.body?.signatory_icnum);

    const updateCustomerQuery = `
      UPDATE customer
      SET
        contact_no = COALESCE(${ph(1)}, contact_no),
        address = COALESCE(${ph(2)}, address),
        city = COALESCE(${ph(3)}, city),
        postcode = COALESCE(${ph(4)}, postcode),
        registration_num = COALESCE(${ph(5)}, registration_num),
        fax_no = COALESCE(${ph(6)}, fax_no),

        admin_title = COALESCE(${ph(7)}, admin_title),
        admin_name = COALESCE(${ph(8)}, admin_name),
        admin_address = COALESCE(${ph(9)}, admin_address),
        admin_city = COALESCE(${ph(10)}, admin_city),
        admin_postcode = COALESCE(${ph(11)}, admin_postcode),
        admin_email = COALESCE(${ph(12)}, admin_email),
        admin_contact = COALESCE(${ph(13)}, admin_contact),
        admin_fax = COALESCE(${ph(14)}, admin_fax),

        service_length = COALESCE(${ph(15)}, service_length),

        signatory_name = COALESCE(${ph(16)}, signatory_name),
        signatory_designation = COALESCE(${ph(17)}, signatory_designation),
        signatory_icnum = COALESCE(${ph(18)}, signatory_icnum),

        form_d_a = COALESCE(${ph(19)}, form_d_a),
        form_d_b = COALESCE(${ph(20)}, form_d_b),
        form_9_49 = COALESCE(${ph(21)}, form_9_49),
        form_13_49 = COALESCE(${ph(22)}, form_13_49),
        form_79_80_83 = COALESCE(${ph(23)}, form_79_80_83),
        file_latestbill = COALESCE(${ph(24)}, file_latestbill),
        file_other = COALESCE(${ph(25)}, file_other),

        application_type = COALESCE(${ph(26)}, application_type)
      WHERE user_id = ${ph(27)}
    `;

    const params = [
      phone,
      company_address,
      company_city,
      company_postcode,
      registration_num,
      company_fax,

      admin_title,
      admin_name,
      admin_address,
      admin_city,
      admin_postcode,
      admin_email,
      admin_contact,
      admin_fax,

      service_length,

      signatory_name,
      signatory_designation,
      signatory_icnum,

      newFileValues["form_d_a"],
      newFileValues["form_d_b"],
      newFileValues["form_9_49"],
      newFileValues["form_13_49"],
      newFileValues["form_79_80_83"],
      newFileValues["file_latestbill"],
      newFileValues["file_other"],

      application_type,
      userId,
    ];

    await runQuery(db, updateCustomerQuery, params);

    return res.json({ ok: true, message: "Profile updated." });
  } catch (err) {
    console.error("❌ Error updating my customer profile:", err);
    next(err);
  }
};

exports.deleteMyCustomerFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { field } = req.params;

    if (!allowedFileFields.includes(field)) {
      return res.status(400).json({ ok: false, message: "Invalid file field" });
    }

    const db = getConnection(process.env.DB_TYPE);

    const resRows = await runQuery(
      db,
      `SELECT ${field} FROM customer WHERE user_id = ${ph(1)} LIMIT 1`,
      [userId]
    );

    const row = firstRow(resRows);
    if (!row) return res.status(404).json({ ok: false, message: "Customer not found" });

    const fileName = row[field];
    if (!fileName) return res.status(400).json({ ok: false, message: "No file found in this field" });

    // ✅ correct path handling for "123/file.pdf" and "file.pdf"
    const filePath = getCustomerFileAbsPath(fileName);

    try {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.error("⚠️ File delete error:", err);
    }

    await runQuery(db, `UPDATE customer SET ${field} = NULL WHERE user_id = ${ph(1)}`, [userId]);

    return res.json({ ok: true, message: `${field} deleted successfully.` });
  } catch (err) {
    console.error("❌ Error deleting my file:", err);
    return res.status(500).json({ ok: false, message: "Failed to delete file." });
  }
};

// =========================
// Customer Groups
// =========================

// GET /api/customers/mobile/groups
exports.getCustomerGroups = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      SELECT id, code, name, created_at
      FROM customer_groups
      ORDER BY name ASC
    `;

    const rows = await runQuery(db, sql, []);
    return res.json({ ok: true, data: rows || [] });
  } catch (err) {
    console.error("[getCustomerGroups] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to load groups" });
  }
};

// GET /api/customers/mobile/groups/:groupId/customers
exports.getCustomersByGroup = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const groupId = Number(req.params.groupId);

    if (!groupId || Number.isNaN(groupId)) {
      return res.status(400).json({ ok: false, message: "Invalid groupId" });
    }

    const sql = `
      SELECT
        c.id,
        c.customer_code,
        u.name,
        c.contact_no,
        c.customer_group_id
      FROM customer c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.customer_group_id = ${ph(1)}
      ORDER BY u.name ASC
    `;

    const rows = await runQuery(db, sql, [groupId]);
    return res.json({ ok: true, data: rows || [] });
  } catch (err) {
    console.error("[getCustomersByGroup] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to load customers" });
  }
};

// GET /api/customers/mobile/available-customers?q=abc
exports.getAvailableCustomers = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const q = (req.query.q || "").toString().trim().toLowerCase();

    let sql = `
      SELECT
        c.id,
        c.customer_code,
        u.name,
        c.contact_no,
        c.customer_group_id
      FROM customer c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE (c.customer_group_id IS NULL OR c.customer_group_id = 0)
    `;

    const params = [];

    if (q) {
      sql += `
        AND (
          LOWER(c.customer_code) LIKE ${ph(1)} OR
          LOWER(u.name) LIKE ${ph(2)} OR
          LOWER(c.contact_no) LIKE ${ph(3)}
        )
      `;
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    sql += ` ORDER BY u.name ASC`;

    const rows = await runQuery(db, sql, params);
    return res.json({ ok: true, data: rows || [] });
  } catch (err) {
    console.error("[getAvailableCustomers] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to load customers" });
  }
};


// POST /api/customers/mobile/groups/:groupId/customers  { customerId }
exports.addCustomerToGroup = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const groupId = Number(req.params.groupId);
    const customerId = Number(req.body?.customerId);

    if (!groupId || Number.isNaN(groupId)) {
      return res.status(400).json({ ok: false, message: "Invalid groupId" });
    }
    if (!customerId || Number.isNaN(customerId)) {
      return res.status(400).json({ ok: false, message: "Invalid customerId" });
    }

    await runQuery(
      db,
      `UPDATE customer SET customer_group_id = ${ph(1)} WHERE id = ${ph(2)}`,
      [groupId, customerId]
    );

    // ✅ Verify (works for MySQL/Postgres regardless of affectedRows/rowCount)
    const check = await runQuery(
      db,
      `SELECT id, customer_group_id FROM customer WHERE id = ${ph(1)} LIMIT 1`,
      [customerId]
    );

    if (!check?.length) {
      return res.status(404).json({ ok: false, message: "Customer not found" });
    }

    const actualGroupId = Number(check[0].customer_group_id ?? 0);
    if (actualGroupId !== groupId) {
      return res.status(500).json({
        ok: false,
        message: "Update executed but group not updated (verification failed)",
      });
    }

    return res.json({ ok: true, message: "Customer added to group" });
  } catch (err) {
    console.error("[addCustomerToGroup] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to add customer to group" });
  }
};


// DELETE /api/customers/mobile/groups/:groupId/customers/:customerId
exports.removeCustomerFromGroup = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const groupId = Number(req.params.groupId);
    const customerId = Number(req.params.customerId);

    if (!groupId || Number.isNaN(groupId)) {
      return res.status(400).json({ ok: false, message: "Invalid groupId" });
    }
    if (!customerId || Number.isNaN(customerId)) {
      return res.status(400).json({ ok: false, message: "Invalid customerId" });
    }

    await runQuery(
      db,
      `UPDATE customer
       SET customer_group_id = 0
       WHERE id = ${ph(1)} AND customer_group_id = ${ph(2)}`,
      [customerId, groupId]
    );

    // ✅ Verify removal
    const check = await runQuery(
      db,
      `SELECT id, customer_group_id FROM customer WHERE id = ${ph(1)} LIMIT 1`,
      [customerId]
    );

    if (!check?.length) {
      return res.status(404).json({ ok: false, message: "Customer not found" });
    }

    const actual = check[0].customer_group_id;
    const cleared = actual === 0 || actual === "0" || actual === null;

    if (!cleared) {
      return res.status(500).json({
        ok: false,
        message: "Update executed but group not cleared (verification failed)",
      });
    }


    return res.json({ ok: true, message: "Customer removed from group" });
  } catch (err) {
    console.error("[removeCustomerFromGroup] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to remove customer from group" });
  }
};

// PUT /api/customers/mobile/groups/:groupId
exports.updateCustomerGroup = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const groupId = Number(req.params.groupId);

    if (!groupId || Number.isNaN(groupId)) {
      return res.status(400).json({ ok: false, message: "Invalid groupId" });
    }

    const name = clean(req.body?.name);
    const code = clean(req.body?.code);

    if (!name && !code) {
      return res.status(400).json({ ok: false, message: "Nothing to update" });
    }

    // only update provided fields
    // (works for both mysql/postgres using placeholders)
    let setSql = [];
    let params = [];
    let i = 1;

    if (name) {
      setSql.push(`name = ${ph(i++)}`);
      params.push(name);
    }
    if (code) {
      setSql.push(`code = ${ph(i++)}`);
      params.push(code);
    }

    params.push(groupId);

    const sql = `
      UPDATE customer_groups
      SET ${setSql.join(", ")}
      WHERE id = ${ph(i)}
    `;

    await runQuery(db, sql, params);

    // ✅ return ok true if no error (again, don't rely on affectedRows)
    return res.json({ ok: true, message: "Group updated" });
  } catch (err) {
    console.error("[updateCustomerGroup] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to update group" });
  }
};

const getNextGroupCode = async (db) => {
  // Get latest GRPxxx code (works for MySQL + Postgres)
  const sql = isPostgres()
    ? `
      SELECT code
      FROM customer_groups
      WHERE code ILIKE 'GRP%'
      ORDER BY CAST(SUBSTRING(code FROM 4) AS INT) DESC
      LIMIT 1
    `
    : `
      SELECT code
      FROM customer_groups
      WHERE code LIKE 'GRP%'
      ORDER BY CAST(SUBSTRING(code, 4) AS UNSIGNED) DESC
      LIMIT 1
    `;

  const rows = await runQuery(db, sql, []);
  const lastCode = rows?.[0]?.code || "GRP000";

  // Extract numeric part (e.g. GRP003 -> 3)
  const lastNum = parseInt(String(lastCode).replace(/\D/g, ""), 10) || 0;
  const nextNum = lastNum + 1;

  // GRP + 3 digits padding
  return `GRP${String(nextNum).padStart(3, "0")}`;
};

// POST /api/customers/mobile/groups
exports.createCustomerGroup = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const name = (req.body?.name || "").toString().trim();
    if (!name) {
      return res.status(400).json({ ok: false, message: "Group name is required" });
    }

    // ✅ always auto-generate next code
    const code = await getNextGroupCode(db);

    // Insert
    const insertSql = isPostgres()
      ? `INSERT INTO customer_groups (code, name) VALUES (${ph(1)}, ${ph(2)}) RETURNING id, code, name`
      : `INSERT INTO customer_groups (code, name) VALUES (${ph(1)}, ${ph(2)})`;

    const result = await runQuery(db, insertSql, [code, name]);

    // Return inserted row
    if (isPostgres()) {
      return res.json({ ok: true, message: "Group created", data: result?.[0] });
    } else {
      // MySQL: get inserted id then query back (optional)
      const id = result?.insertId;
      return res.json({ ok: true, message: "Group created", data: { id, code, name } });
    }
  } catch (err) {
    console.error("[createCustomerGroup] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to create group" });
  }
};

