// src/controllers/customerController.js
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
exports.getCustomers = async (req, res, next) => {
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
    const defaultQuery = `SELECT * FROM users LEFT JOIN user_role ON users.role_id = user_role.id WHERE users.status_id = 2`;

    // Query with selected fields if provided
    const queryWithCond = ` SELECT ${fieldList} FROM users 
                            LEFT JOIN user_role ON users.role_id = user_role.id 
                            LEFT JOIN customer ON users.id = customer.user_id
                            LEFT JOIN package ON package.id = customer.package
                            WHERE users.status_id = 2`;

    // ------------------------------------------------------------------------
    // Run Query
    // ------------------------------------------------------------------------
    try {
      const db = getConnection(process.env.DB_TYPE); // e.g. "mysql" or "postgres"
      const query = fieldList ? queryWithCond : defaultQuery;
      let rows = await runQuery(db, query);
      return res.json(rows);
    } catch (error) {
        console.error(error);
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

exports.getCustomersCursor = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const cursor = decodeCursor(req.query.cursor);

    const nameSearch = req.query.name || '';
    const emailSearch = req.query.email || '';
    const contactSearch = req.query.contact_no || '';
    const adminSearch = req.query.admin_name || '';
    const packageSearch = req.query.package_name || '';
    const statusSearch = req.query.status || '';

    const db = getConnection(process.env.DB_TYPE);

    const params = [limit + 1, nameSearch, emailSearch, contactSearch, adminSearch, packageSearch, statusSearch];
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
        user_role.role_name AS role,
        customer.contact_no,
        customer.customer_code,
        customer.admin_name,
        package.package_name
      FROM users
      LEFT JOIN user_role ON users.role_id = user_role.id
      LEFT JOIN customer ON customer.user_id = users.id
      LEFT JOIN package ON package.id = customer.package
      WHERE users.status_id = 2
        AND ($2 = '' OR users.name ILIKE '%' || $2 || '%')
        AND ($3 = '' OR users.email ILIKE '%' || $3 || '%')
        AND ($4 = '' OR customer.contact_no ILIKE '%' || $4 || '%')
        AND ($5 = '' OR customer.admin_name ILIKE '%' || $5 || '%')
        AND ($6 = '' OR package.package_name ILIKE '%' || $6 || '%')
        AND ($7 = '' OR users.acc_status = $7)
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
    console.error('Error in customerController.getCustomersCursor:', err);
    next(err);
  }
};

exports.getUserModules = async (req, res, next) => {
  try {
    const userId = req.user.userId; // middleware should populate req.user

    // const mysqlPool = getConnection('mysql');
    const pgClient = getConnection('postgres');

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
//                       Get Single Customer by ID
// ============================================================================
// Returns detailed info for one customer record by ID.
// Works for both SQL (MySQL/Postgres) and MongoDB.
// ============================================================================
exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ------------------------------------------------------------------------
    // MongoDB
    // ------------------------------------------------------------------------
    if (process.env.USE_MONGO === 'true' && MongoUser) {
      const user = await MongoUser.findById(id).lean();
      if (!user) return res.status(404).json({ message: 'Customer not found' });
      return res.json(user);
    }

    // ------------------------------------------------------------------------
    // SQL Databases (MySQL / Postgres)
    // ------------------------------------------------------------------------
    const db = getConnection(process.env.DB_TYPE);

    const query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.username,
            u.acc_status AS status,
            ur.role_name AS role,
            c.contact_no AS contact_no,
            c.application_type,
            c.address AS company_address,
            c.city AS company_city,
            c.postcode AS company_postcode, 
            c.registration_num,
            c.fax_no AS company_fax,
            c.admin_title,
            c.admin_name, 
            c.admin_address,
            c.admin_city,
            c.admin_postcode,
            c.admin_email,
            c.admin_contact,
            c.admin_fax,
            c.package AS package_id,
            p.package_name, 
            c.service_length,
            c.signatory_name,
            c.signatory_designation,
            c.signatory_icnum,
            c.form_d_a,
            c.form_d_b,
            c.form_9_49,
            c.form_13_49,
            c.form_79_80_83,
            c.file_latestbill,
            c.file_other,
            c.customer_code
          FROM users u
          LEFT JOIN user_role ur ON u.role_id = ur.id
          LEFT JOIN customer c ON c.user_id = u.id
          LEFT JOIN package p ON p.id = c.package
          WHERE u.id = $1
        `;

    const rows = await runQuery(db, query, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching customer by ID:', err);
    next(err);
  }
};


// controllers/customerController.js (updateCustomer)
const fs = require("fs");
const path = require("path");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// returns absolute path of stored file (supports "id/filename" and "filename")
// function getCustomerFileAbsPath(dbValue) {
//   if (!dbValue) return null;
//   const baseDir = path.join(__dirname, "..", "uploads", "customers");
//   return path.join(baseDir, dbValue);
// }
function getCustomerFileAbsPath(dbValue) {
  if (!dbValue) return null;
  const baseDir = path.join(__dirname, "..", "uploads", "customers");

  // new format "123/file.pdf"
  if (dbValue.includes("/")) return path.join(baseDir, dbValue);

  // old format "file.pdf"
  return path.join(baseDir, dbValue);
}

// move uploaded tmp files into /uploads/customers/<userId>/
// input format: { fieldName: req.files[fieldName] }
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


exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      username,
      status,
      role,
      contact_no,
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
      package_id,
      service_length,
      signatory_name,
      signatory_designation,
      signatory_icnum,
      application_type,
    } = req.body;

    const db = getConnection(process.env.DB_TYPE);

    const contactNo = contact_no ?? phone ?? null;

    // ✅ actor + metadata
    const { actorUserId, actorUsername } = await resolveActor(req, db);
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    // ------------------------------------------------------------
    // ✅ BEFORE snapshot
    // ------------------------------------------------------------
    const snapshotQuery = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.username,
        u.acc_status,
        ur.role_name AS role,

        c.contact_no,
        c.address,
        c.city,
        c.postcode,
        c.registration_num,
        c.fax_no,
        c.admin_title,
        c.admin_name,
        c.admin_address,
        c.admin_city,
        c.admin_postcode,
        c.admin_email,
        c.admin_contact,
        c.admin_fax,
        c.package AS package_id,
        p.package_name AS package_name,
        c.service_length,
        c.signatory_name,
        c.signatory_designation,
        c.signatory_icnum,
        c.application_type,

        c.form_d_a,
        c.form_d_b,
        c.form_9_49,
        c.form_13_49,
        c.form_79_80_83,
        c.file_latestbill,
        c.file_other
      FROM users u
      LEFT JOIN user_role ur ON u.role_id = ur.id
      LEFT JOIN customer c ON c.user_id = u.id
      LEFT JOIN package p ON p.id = c.package
      WHERE u.id = $1
    `;

    const beforeRows = await runQuery(db, snapshotQuery, [id]);
    if (!beforeRows?.length)
      return res.status(404).json({ message: "Customer not found" });
    const before = beforeRows[0];

    // ------------------------------------------------------------
    // 1) Update users table
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    // 2) File handling (tmp -> /customers/<id>/)
    // ------------------------------------------------------------
    const fileFields = [
      "form_d_a",
      "form_d_b",
      "form_9_49",
      "form_13_49",
      "form_79_80_83",
      "file_latestbill",
      "file_other",
    ];

    const selectFilesQuery = `
      SELECT ${fileFields.join(", ")}
      FROM customer
      WHERE user_id = $1
    `;
    const selectResult = await runQuery(db, selectFilesQuery, [id]);
    const currentFilesRow = selectResult[0] || {};

    // move any newly uploaded files from tmp -> /<id>/
    const moved = moveTmpFilesToUserFolder(id, {
      form_d_a: req.files?.form_d_a,
      form_d_b: req.files?.form_d_b,
      form_9_49: req.files?.form_9_49,
      form_13_49: req.files?.form_13_49,
      form_79_80_83: req.files?.form_79_80_83,
      file_latestbill: req.files?.file_latestbill,
      file_other: req.files?.file_other,
    });

    // if a new file uploaded, delete old file
    for (const field of fileFields) {
      if (moved[field]) {
        const oldValue = currentFilesRow[field]; // e.g "123/old.pdf" or "old.pdf"
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

    // use moved values for COALESCE update (null means keep existing)
    const newFileValues = {
      form_d_a: moved.form_d_a,
      form_d_b: moved.form_d_b,
      form_9_49: moved.form_9_49,
      form_13_49: moved.form_13_49,
      form_79_80_83: moved.form_79_80_83,
      file_latestbill: moved.file_latestbill,
      file_other: moved.file_other,
    };

    // ------------------------------------------------------------
    // 3) Update customer table (only overwrite file fields if new file uploaded)
    // ------------------------------------------------------------
    const packageIdParam = package_id ? Number(package_id) : null;
    const serviceLengthParam = service_length ? Number(service_length) : null;

    // ------------------------------------------------------------
    // 2) Update customer table
    // ------------------------------------------------------------
    const updateCustomerQuery = `
      UPDATE customer
      SET
        contact_no = $1,
        address = $2,
        city = $3,
        postcode = $4,
        registration_num = $5,
        fax_no = $6,
        admin_title = $7,
        admin_name = $8,
        admin_address = $9,
        admin_city = $10,
        admin_postcode = $11,
        admin_email = $12,
        admin_contact = $13,
        admin_fax = $14,
        package = $15,
        service_length = $16,
        signatory_name = $17,
        signatory_designation = $18,
        signatory_icnum = $19,
        form_d_a = COALESCE($20, form_d_a),
        form_d_b = COALESCE($21, form_d_b),
        form_9_49 = COALESCE($22, form_9_49),
        form_13_49 = COALESCE($23, form_13_49),
        form_79_80_83 = COALESCE($24, form_79_80_83),
        file_latestbill = COALESCE($25, file_latestbill),
        file_other = COALESCE($26, file_other),
        application_type = COALESCE($27, application_type)
      WHERE user_id = $28
    `;

    const params = [
      contactNo || null,
      company_address || null,
      company_city || null,
      company_postcode || null,
      registration_num || null,
      company_fax || null,
      admin_title || null,
      admin_name || null,
      admin_address || null,
      admin_city || null,
      admin_postcode || null,
      admin_email || null,
      admin_contact || null,
      admin_fax || null,
      packageIdParam,
      serviceLengthParam,
      signatory_name || null,
      signatory_designation || null,
      signatory_icnum || null,
      newFileValues["form_d_a"],
      newFileValues["form_d_b"],
      newFileValues["form_9_49"],
      newFileValues["form_13_49"],
      newFileValues["form_79_80_83"],
      newFileValues["file_latestbill"],
      newFileValues["file_other"],
      application_type || null,
      id,
    ];

    await runQuery(db, updateCustomerQuery, params);

    // ------------------------------------------------------------
    // ✅ AFTER snapshot + audit
    // ------------------------------------------------------------
    const afterRows = await runQuery(db, snapshotQuery, [id]);
    const after = afterRows?.[0] ?? null;

    // ------------------------------------------------------------
    // ✅ DIFF + AUDIT (only if changed)
    // ------------------------------------------------------------
    const changed_fields = diffObjects(before, after);

    if (Object.keys(changed_fields).length > 0) {
      await logAudit(db, {
        actor_user_id: actorUserId,
        actor_username: actorUsername,
        action: "UPDATE",
        entity_table: "customer",
        entity_id: String(id),
        module: "People",
        endpoint: `${req.method} ${req.originalUrl}`,
        description: `Updated customer user_id=${id}`,
        before_data: before,
        after_data: after,
        changed_fields,
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return res.json({ message: "Customer updated successfully." });
  } catch (err) {
    console.error("❌ Error updating customer:", err);
    next(err);
  }
};



// ============================================================================
//                       Delete a Customer Attachment
// ============================================================================
// Endpoint: DELETE /api/customers/:id/file/:field
// ============================================================================
exports.deleteCustomerFile = async (req, res) => {
  try {
    const { id, field } = req.params;

    // Allowed fields only (security)
    const allowedFields = [
      'form_d_a',
      'form_d_b',
      'form_9_49',
      'form_13_49',
      'form_79_80_83',
      'file_latestbill',
      'file_other',
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid file field' });
    }

    const db = getConnection(process.env.DB_TYPE);

    // 1️⃣ Fetch current filename
    const query = `SELECT ${field} FROM customer WHERE user_id = $1`;
    const rows = await runQuery(db, query, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const fileName = rows[0][field];
    if (!fileName) {
      return res.status(400).json({ error: 'No file found in this field' });
    }

    // 2️⃣ Delete physical file from uploads folder
    // const filePath = path.join(__dirname, '..', 'uploads', 'customers', fileName);
    const filePath = getCustomerFileAbsPath(fileName);

    try {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.error("⚠️ File delete error:", err);
    }

    // 3️⃣ Nullify that column in DB
    const updateQuery = `UPDATE customer SET ${field} = NULL WHERE user_id = $1`;
    await runQuery(db, updateQuery, [id]);

    res.json({ message: `${field} deleted successfully.` });
  } catch (err) {
    console.error('❌ Error deleting file:', err);
    res.status(500).json({ error: 'Failed to delete file.' });
  }
};


// ============================================================================
//                       Create Customer (with File Upload)
// ============================================================================
// Inserts into users table and customer table, and stores uploaded filenames
// ============================================================================
exports.createCustomer = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    // ✅ actor + metadata
    const { actorUserId, actorUsername } = await resolveActor(req, db);
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    // Extract text data
    const {
      username,
      email,
      name,
      status,
      contact_no,
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
      package_id,
      service_length,
      signatory_name,
      signatory_designation,
      signatory_icnum,
      password,
      application_type,
    } = req.body;

    // ✅ Normalize username
    const normalizedUsername = (username || "").trim().toLowerCase();

    if (!normalizedUsername) {
      return res.status(400).json({ message: "Username is required." });
    }

    // ✅ Check if username already exists
    const existingUserQuery = `
      SELECT id FROM users WHERE LOWER(username) = $1 LIMIT 1
    `;
    const existingUser = await runQuery(db, existingUserQuery, [normalizedUsername]);

    if (existingUser?.length > 0) {
      return res.status(409).json({ message: "Username already exists." });
    }

    // 🔹 1. Hash password
    const hashed = await hashPassword(password);

    // 🔹 2. Insert user
    const insertUserQuery = `
      INSERT INTO users (username, email, name, acc_status, password, created_at, status_id)
      VALUES ($1, $2, $3, $4, $5, NOW(), 2)
      RETURNING id
    `;
    const userResult = await runQuery(db, insertUserQuery, [
      normalizedUsername,
      email,
      name,
      status,
      hashed,
    ]);
    const userId = userResult[0].id;

    // ✅ FILES: move from tmp -> /uploads/customers/<userId>/
    // (same pattern as publicRegisterCustomer)
    const files = req.files || {};

    const moved = moveTmpFilesToUserFolder(userId, {
      form_d_a: files.form_d_a,
      form_d_b: files.form_d_b,
      form_9_49: files.form_9_49,
      form_13_49: files.form_13_49,
      form_79_80_83: files.form_79_80_83,
      file_latestbill: files.file_latestbill,
      file_other: files.file_other,
    });

    // ✅ DB value should be "userId/filename"
    const fileData = {
      form_d_a: moved.form_d_a,
      form_d_b: moved.form_d_b,
      form_9_49: moved.form_9_49,
      form_13_49: moved.form_13_49,
      form_79_80_83: moved.form_79_80_83,
      file_latestbill: moved.file_latestbill,
      file_other: moved.file_other,
    };

    // Convert optional params
    const packageIdParam = package_id ? Number(package_id) : null;
    const serviceLengthParam = service_length ? Number(service_length) : null;

    // 🔹 3. Insert customer
    const insertCustomerQuery = `
      INSERT INTO customer (
        user_id, contact_no, address, city, postcode, registration_num, fax_no,
        admin_title, admin_name, admin_address, admin_city, admin_postcode,
        admin_email, admin_contact, admin_fax, package, service_length,
        signatory_name, signatory_designation, signatory_icnum,
        form_d_a, form_d_b, form_9_49, form_13_49, form_79_80_83,
        file_latestbill, file_other, application_type
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15,
        $16,
        $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28
      )
    `;

    await runQuery(db, insertCustomerQuery, [
      userId,
      contact_no || null,
      company_address || null,
      company_city || null,
      company_postcode || null,
      registration_num || null,
      company_fax || null,
      admin_title || null,
      admin_name || null,
      admin_address || null,
      admin_city || null,
      admin_postcode || null,
      admin_email || null,
      admin_contact || null,
      admin_fax || null,
      packageIdParam,
      serviceLengthParam,
      signatory_name || null,
      signatory_designation || null,
      signatory_icnum || null,
      fileData.form_d_a,
      fileData.form_d_b,
      fileData.form_9_49,
      fileData.form_13_49,
      fileData.form_79_80_83,
      fileData.file_latestbill,
      fileData.file_other,
      application_type || null,
    ]);

    // ✅ AFTER snapshot for audit
    const snapshotQuery = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.username,
        u.acc_status,

        c.contact_no,
        c.address,
        c.city,
        c.postcode,
        c.registration_num,
        c.fax_no,
        c.admin_title,
        c.admin_name,
        c.admin_address,
        c.admin_city,
        c.admin_postcode,
        c.admin_email,
        c.admin_contact,
        c.admin_fax,
        c.package AS package_id,
        p.package_name AS package_name,
        c.service_length,
        c.signatory_name,
        c.signatory_designation,
        c.signatory_icnum,
        c.application_type,

        c.form_d_a,
        c.form_d_b,
        c.form_9_49,
        c.form_13_49,
        c.form_79_80_83,
        c.file_latestbill,
        c.file_other
      FROM users u
      LEFT JOIN customer c ON c.user_id = u.id
      LEFT JOIN package p ON p.id = c.package
      WHERE u.id = $1
    `;
    const afterRows = await runQuery(db, snapshotQuery, [userId]);
    const after = afterRows?.[0] ?? null;

    // ✅ Audit: CREATE
    await logAudit(db, {
      actor_user_id: actorUserId,
      actor_username: actorUsername,
      action: "CREATE",
      entity_table: "customer",
      entity_id: String(userId),
      module: "People",
      endpoint: `${req.method} ${req.originalUrl}`,
      description: `Created customer user_id=${userId}`,
      before_data: null,
      after_data: after,
      changed_fields: after ? diffObjects({}, after) : null,
      ip_address: ip,
      user_agent: userAgent,
    });

    return res.status(201).json({
      message: "✅ Customer created successfully.",
      userId,
      uploadedFiles: fileData, // ✅ now returns "id/filename" like publicRegisterCustomer
    });
  } catch (err) {
    console.error("❌ Error creating customer:", err);
    return res.status(500).json({
      message: "Failed to create customer",
      error: err.message,
    });
  }
};


// ============================================================================
//                       Public Registration (no login yet)
//   Endpoint: POST /api/customers/public/register
//   - Creates a minimal users row (Pending) + customer row
// ============================================================================
exports.publicRegisterCustomer = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    // Map fields from public form (SignupVariant6)
    const {
      applicationType,
      businessName,
      registeredAddress,
      cityState,
      postcode,
      businessRegNo,
      contactNumber,
      faxNumber,
      billingContactName,
      billingAddress,
      billingCityState,
      billingPostcode,
      billingEmail,
      billingContactNumber,
      billingFax,
      servicePlanId,
      minContractMonths,
      signatoryName,
      designation,
      nricPassport,
      title,
      username,
    } = req.body;

    // Basic validation
    if (!businessName || !billingEmail || !contactNumber) {
      return res.status(400).json({
        message: "Business name, billing email and contact number are required.",
      });
    }

    // 1) Create minimal user
    const email = billingEmail;
    const requestedUsername = (username || "").trim().toLowerCase();

    if (!requestedUsername) {
      return res.status(400).json({ message: "Username is required." });
    }

    if (!/^[a-z0-9._-]{4,}$/.test(requestedUsername)) {
      return res.status(400).json({
        message:
          "Invalid username. Use min 4 chars. Allowed: letters, numbers, dot, dash, underscore.",
      });
    }

    const existsQuery = `SELECT 1 FROM users WHERE username = $1 LIMIT 1`;
    const exists = await runQuery(db, existsQuery, [requestedUsername]);
    if (exists.length > 0) {
      return res.status(409).json({
        message: "Username already exists. Please choose another.",
      });
    }

    const name = businessName;
    const status = "Pending";
    const randomPlainPassword = Math.random().toString(36).slice(2, 10);
    const hashed = await hashPassword(randomPlainPassword);

    const insertUserQuery = `
      INSERT INTO users (username, email, name, acc_status, password, created_at, status_id)
      VALUES ($1, $2, $3, $4, $5, NOW(), 2)
      RETURNING id
    `;
    const userResult = await runQuery(db, insertUserQuery, [
      requestedUsername,
      email,
      name,
      status,
      hashed,
    ]);
    const userId = userResult[0].id;

    // 2) Handle files from multer (currently saved in uploads/customers/tmp)
    const files = req.files || {};

    // move into /uploads/customers/<userId>/
    const moved = moveTmpFilesToUserFolder(userId, {
      form_d_a: files.form_d_a,
      form_d_b: files.form_d_b,
      form_9_49: files.form_9_49,
      form_13_49: files.form_13_49,
      form_79_80_83: files.form_79_80_83,
      file_latestbill: files.file_latestbill,
      file_other: files.file_other,
      signature: files.signature,
    });

    // save DB value as "userId/filename"
    const fileData = {
      form_d_a: moved.form_d_a,
      form_d_b: moved.form_d_b,
      form_9_49: moved.form_9_49,
      form_13_49: moved.form_13_49,
      form_79_80_83: moved.form_79_80_83,
      file_latestbill: moved.file_latestbill,
      file_other: moved.file_other,
      signature: moved.signature,
    };

    const packageIdParam = servicePlanId || null;
    const serviceLengthParam = minContractMonths ? Number(minContractMonths) : null;

    // 3) Insert customer
    const insertCustomerQuery = `
      INSERT INTO customer (
        user_id, contact_no, address, city, postcode, registration_num, fax_no,
        admin_title, admin_name, admin_address, admin_city, admin_postcode,
        admin_email, admin_contact, admin_fax, package, service_length,
        signatory_name, signatory_designation, signatory_icnum,
        form_d_a, form_d_b, form_9_49, form_13_49, form_79_80_83,
        file_latestbill, file_other, signature, application_type
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29
      )
    `;

    await runQuery(db, insertCustomerQuery, [
      userId,
      contactNumber || null,
      registeredAddress || null,
      cityState || null,
      postcode || null,
      businessRegNo || null,
      faxNumber || null,
      title || null,
      billingContactName || null,
      billingAddress || null,
      billingCityState || null,
      billingPostcode || null,
      billingEmail || null,
      billingContactNumber || null,
      billingFax || null,
      packageIdParam,
      serviceLengthParam,
      signatoryName || null,
      designation || null,
      nricPassport || null,
      fileData.form_d_a,
      fileData.form_d_b,
      fileData.form_9_49,
      fileData.form_13_49,
      fileData.form_79_80_83,
      fileData.file_latestbill,
      fileData.file_other,
      fileData.signature,
      applicationType || null,
    ]);

    return res.status(201).json({
      message: "✅ Registration submitted successfully.",
      userId,
      uploadedFiles: fileData,
    });
  } catch (err) {
    console.error("❌ Error in publicRegisterCustomer:", err);

    if (err.code === "23505") {
      return res.status(409).json({
        message: "Username already exists. Please choose another.",
        error: err.detail,
      });
    }

    return res.status(500).json({
      message: "Failed to submit registration",
      error: err.message,
    });
  }
};

// ============================================================================
//                       Delete (Soft) Customer
// ============================================================================
// NOTE: Your getCustomers() filters users.status_id = 2
// So to hide a customer from the list, we set status_id = 0 (same as staff delete)
exports.deleteCustomer = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid customer id" });
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

    // BEFORE (minimal snapshot from users + customer)
    const beforeRows = await runQuery(
      db,
      `
      SELECT 
        u.id, u.username, u.name, u.acc_status, u.status_id,
        c.user_id AS customer_user_id
      FROM users u
      LEFT JOIN customer c ON c.user_id = u.id
      WHERE u.id = $1
      `,
      [id]
    );

    if (!beforeRows?.length) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const before = beforeRows[0];

    // Optional safety: ensure this user is actually a customer (status_id = 2)
    if (Number(before.status_id) !== 2) {
      return res.status(400).json({ message: "User is not a customer (status_id != 2)" });
    }

    // ✅ Soft delete: hide from getCustomers() by changing status_id
    const updateQuery = `
      UPDATE users
      SET acc_status = 'Inactive'
      WHERE id = $1
      AND status_id = 2
    `;

    await runQuery(db, updateQuery, [id]);

    // AFTER
    const afterRows = await runQuery(
      db,
      `SELECT id, username, name, acc_status, status_id FROM users WHERE id = $1`,
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
        description: `Soft-deleted customer user_id=${id}`,
        before_data: before,
        after_data: after,
        changed_fields,
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return res.json({ message: "Customer deactivated (soft deleted).", id });
  } catch (err) {
    console.error("Error deleting customer:", err);
    next(err);
  }
};

exports.getCustomerByCode = async (req, res, next) => {
  try {
    const code = (req.body.code || req.query.code || '').trim();

    console.log("Searching customers by code:", code);

    const defaultQuery = `
      SELECT c.contact_no, u.name AS customer_name, c.customer_code
      FROM customer c
      JOIN users u ON c.user_id = u.id
      WHERE u.acc_status = 'Active'
      AND u.status_id = 2
      AND c.customer_code IS NOT NULL
      ORDER BY c.customer_code ASC
    `;

    const searchQuery = `
      SELECT c.contact_no, u.name AS customer_name, c.customer_code
      FROM customer c
      JOIN users u ON c.user_id = u.id
      WHERE c.customer_code LIKE $1
      AND u.acc_status = 'Active'
      AND u.status_id = 2
      AND c.customer_code IS NOT NULL
      ORDER BY c.customer_code ASC
    `;

    const db = getConnection(process.env.DB_TYPE);
    const rows = code
      ? await runQuery(db, searchQuery, [`%${code}%`])
      : await runQuery(db, defaultQuery);

    return res.json(rows);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to retrieve results' });
  }
};

exports.getCustomerByName = async (req, res, next) => {
  try {
    const name = (req.body.name || req.query.name || '').trim();

    console.log("Searching customers by name:", name);
    const sanitized_name = name ? `%${name.replace(/%/g, '\\%').replace(/_/g, '\\_')}%` : null;

    const defaultQuery = `
          SELECT c.contact_no, u.name AS customer_name, c.customer_code
          FROM customer c
          JOIN users u ON c.user_id = u.id
          WHERE u.acc_status = 'Active'
          AND u.status_id = 2
          AND c.customer_code IS NOT NULL
          ORDER BY u.name ASC
        `;

    const searchQuery = `
          SELECT c.contact_no, u.name AS customer_name, c.customer_code
          FROM customer c
          JOIN users u ON c.user_id = u.id
          WHERE u.name ILIKE $1
          AND u.acc_status = 'Active'
          AND u.status_id = 2
          AND c.customer_code IS NOT NULL
          ORDER BY u.name ASC
        `;

    const db = getConnection(process.env.DB_TYPE);
    const rows = sanitized_name
    ? await runQuery(db, searchQuery, [sanitized_name])
    : await runQuery(db, defaultQuery);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve results' });
  }
};

exports.getMyCustomerProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId; // from verifyToken middleware
    console.log(req.user);
    const db = getConnection(process.env.DB_TYPE);

    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.username,
        u.acc_status AS status,
        ur.role_name AS role,
        c.contact_no AS phone,
        c.application_type,
        c.address AS company_address,
        c.city AS company_city,
        c.postcode AS company_postcode, 
        c.registration_num,
        c.fax_no AS company_fax,
        c.admin_title,
        c.admin_name, 
        c.admin_address,
        c.admin_city,
        c.admin_postcode,
        c.admin_email,
        c.admin_contact,
        c.admin_fax,
        p.package_name, 
        c.service_length,
        c.signatory_name,
        c.signatory_designation,
        c.signatory_icnum,
        c.form_d_a,
        c.form_d_b,
        c.form_9_49,
        c.form_13_49,
        c.form_79_80_83,
        c.file_latestbill,
        c.file_other,
        c.customer_code
      FROM users u
      LEFT JOIN user_role ur ON u.role_id = ur.id
      LEFT JOIN customer c ON c.user_id = u.id
      LEFT JOIN package p ON p.id = c.package
      WHERE u.id = $1
      LIMIT 1
    `;

    const rows = await runQuery(db, query, [userId]);

    if (!rows?.length) return res.status(404).json({ message: 'Customer not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching my customer profile:', err);
    next(err);
  }
};
