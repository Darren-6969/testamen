// src/controllers/branchesMobileController.js
const { getConnection, runQuery } = require("../db/connectionManager");

async function generateNextBranchCode(db, isPg) {
  const sql = `
    SELECT branch_code
    FROM branch
    WHERE branch_code LIKE 'BR%'
    ORDER BY branch_code DESC
    LIMIT 1
  `;

  const rows = await runQuery(db, sql, []);
  const lastCode = rows?.[0]?.branch_code;

  if (!lastCode) return "BR0001";

  const num = parseInt(lastCode.replace("BR", ""), 10);
  const nextNum = num + 1;

  return `BR${String(nextNum).padStart(4, "0")}`;
}

exports.getBranches = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      SELECT
        id AS id,
        branch_name,
        branch_code,
        status
      FROM branch
      ORDER BY branch_name ASC
    `;

    const rows = await runQuery(db, sql, []);
    return res.json(rows);
  } catch (err) {
    console.error("[getBranches] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to load branches" });
  }
};

// optional (for future use)
exports.getBranchById = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const branchId = Number(req.params.branchId);

    if (!branchId || Number.isNaN(branchId)) {
      return res.status(400).json({ ok: false, message: "Invalid branchId" });
    }

    const p1 = isPg ? "$1" : "?";

    const sql = `
      SELECT id AS id, branch_name, branch_code, status
      FROM branch
      WHERE id = ${p1}
      LIMIT 1
    `;

    const rows = await runQuery(db, sql, [branchId]);
    const branch = Array.isArray(rows) ? rows[0] : null;

    if (!branch) {
      return res.status(404).json({ ok: false, message: "Branch not found" });
    }

    return res.json({ ok: true, data: branch });
  } catch (err) {
    console.error("[getBranchById] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to load branch" });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const dbType = (process.env.DB_TYPE || "").toLowerCase();
    const isPg = dbType.includes("post");

    const branchId = Number(req.params.branchId);
    if (!branchId || Number.isNaN(branchId)) {
      return res.status(400).json({ ok: false, message: "Invalid branchId" });
    }

    const { branch_name, status, package_ids } = req.body || {};

    if (!branch_name || String(branch_name).trim() === "") {
      return res.status(400).json({ ok: false, message: "branch_name is required" });
    }

    const allowed = ["Active", "Inactive"];
    const safeStatus = allowed.includes(status) ? status : "Active";
    const newName = String(branch_name).trim();

    // ✅ set correct PK column name
    const PK = "id";

    // ✅ placeholders
    const p1 = isPg ? "$1" : "?";
    const p2 = isPg ? "$2" : "?";
    const p3 = isPg ? "$3" : "?";

    // 1) Check existing
    const sqlCheck = `
      SELECT ${PK} AS id, branch_name, status, branch_code
      FROM branch
      WHERE ${PK} = ${p1}
      LIMIT 1
    `;
    const chk = await runQuery(db, sqlCheck, [branchId]);
    const existing = Array.isArray(chk) ? chk[0] : null;

    if (!existing) {
      return res.status(404).json({ ok: false, message: "Branch not found" });
    }

    // 2) update branch fields
    const sqlUpdate = `
      UPDATE branch
      SET branch_name = ${p1}, status = ${p2}
      WHERE ${PK} = ${p3}
    `;
    await runQuery(db, sqlUpdate, [newName, safeStatus, branchId]);

    // 3) sync packages
    const ids = Array.isArray(package_ids)
      ? package_ids.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)
      : [];

    // delete current mappings
    const delSql = `DELETE FROM branch_package WHERE branch_id = ${p1}`;
    await runQuery(db, delSql, [branchId]);

    // insert new mappings
    if (ids.length > 0) {
      if (isPg) {
        // Postgres: bulk insert with placeholders
        // VALUES ($1,$2), ($1,$3), ...
        const values = ids.map((_, i) => `(${p1}, $${i + 2})`).join(", ");
        const insSql = `INSERT INTO branch_package (branch_id, package_id) VALUES ${values}`;
        await runQuery(db, insSql, [branchId, ...ids]);
      } else {
        // MySQL: multi-row insert VALUES (?,?),(?,?)
        const values = ids.map(() => "(?, ?)").join(", ");
        const params = ids.flatMap((pid) => [branchId, pid]);
        const insSql = `INSERT INTO branch_package (branch_id, package_id) VALUES ${values}`;
        await runQuery(db, insSql, params);
      }
    }

    // 4) return updated branch + package ids
    const afterRows = await runQuery(db, sqlCheck, [branchId]);
    const updated = Array.isArray(afterRows) ? afterRows[0] : null;

    return res.json({
      ok: true,
      message: "Branch updated successfully",
      data: { ...updated, package_ids: ids },
    });
  } catch (err) {
    console.error("[updateBranch] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to update branch" });
  }
};


exports.getBranchPackages = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const dbType = (process.env.DB_TYPE || "").toLowerCase();
    const isPg = dbType.includes("post");

    const branchId = Number(req.params.branchId);
    if (!branchId || Number.isNaN(branchId)) {
      return res.status(400).json({ ok: false, message: "Invalid branchId" });
    }

    const p1 = isPg ? "$1" : "?";

    const sql = `
      SELECT p.id, p.package_code, p.package_name, p.monthly_fee
      FROM branch_package bp
      JOIN package p ON p.id = bp.package_id
      WHERE bp.branch_id = ${p1}
      ORDER BY p.package_name ASC
    `;

    const rows = await runQuery(db, sql, [branchId]);
    return res.json({ ok: true, data: rows || [] });
  } catch (err) {
    console.error("[getBranchPackages] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to load branch packages" });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const dbType = (process.env.DB_TYPE || "").toLowerCase();
    const isPg = dbType.includes("post");

    const { branch_name, status, package_ids } = req.body || {};

    if (!branch_name || String(branch_name).trim() === "") {
      return res.status(400).json({ ok: false, message: "branch_name is required" });
    }

    const allowed = ["Active", "Inactive"];
    const safeStatus = allowed.includes(status) ? status : "Active";
    const name = String(branch_name).trim();

    // ✅ AUTO GENERATE BRANCH CODE
    const branch_code = await generateNextBranchCode(db, isPg);

    let newId;

    if (isPg) {
      const sql = `
        INSERT INTO branch (branch_name, branch_code, status)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const rows = await runQuery(db, sql, [name, branch_code, safeStatus]);
      newId = rows?.[0]?.id;
    } else {
      const sql = `
        INSERT INTO branch (branch_name, branch_code, status)
        VALUES (?, ?, ?)
      `;
      const result = await runQuery(db, sql, [name, branch_code, safeStatus]);
      newId = result?.insertId;
    }

    if (!newId) {
      return res.status(500).json({ ok: false, message: "Failed to create branch" });
    }

    // ✅ OPTIONAL: sync packages
    const ids = Array.isArray(package_ids)
      ? package_ids.map(Number).filter((x) => Number.isFinite(x) && x > 0)
      : [];

    if (ids.length > 0) {
      if (isPg) {
        const values = ids.map((_, i) => `($1, $${i + 2})`).join(", ");
        const insSql = `INSERT INTO branch_package (branch_id, package_id) VALUES ${values}`;
        await runQuery(db, insSql, [newId, ...ids]);
      } else {
        const values = ids.map(() => "(?, ?)").join(", ");
        const params = ids.flatMap((pid) => [newId, pid]);
        const insSql = `INSERT INTO branch_package (branch_id, package_id) VALUES ${values}`;
        await runQuery(db, insSql, params);
      }
    }

    return res.status(201).json({
      ok: true,
      message: "Branch created successfully",
      data: {
        id: newId,
        branch_code,
        branch_name: name,
        status: safeStatus,
        package_ids: ids,
      },
    });
  } catch (err) {
    console.error("[createBranch] ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: err?.detail || err?.message || "Failed to create branch",
    });
  }
};


// exports.createBranch = async (req, res) => {
//   try {
//     const db = getConnection(process.env.DB_TYPE);
//     const dbType = (process.env.DB_TYPE || "").toLowerCase();
//     const isPg = dbType.includes("post");

//     const { branch_name, branch_code, status, package_ids } = req.body || {};

//     if (!branch_name || String(branch_name).trim() === "") {
//       return res.status(400).json({ ok: false, message: "branch_name is required" });
//     }

//     const allowed = ["Active", "Inactive"];
//     const safeStatus = allowed.includes(status) ? status : "Active";

//     const name = String(branch_name).trim();
//     const code = branch_code ? String(branch_code).trim() : null;

//     // ✅ Insert branch
//     let newId;

//     if (isPg) {
//       const sql = `
//         INSERT INTO branch (branch_name, branch_code, status)
//         VALUES ($1, $2, $3)
//         RETURNING id
//       `;
//       const rows = await runQuery(db, sql, [name, code, safeStatus]);
//       newId = rows?.[0]?.id;
//     } else {
//       const sql = `
//         INSERT INTO branch (branch_name, branch_code, status)
//         VALUES (?, ?, ?)
//       `;
//       const result = await runQuery(db, sql, [name, code, safeStatus]);
//       newId = result?.insertId;
//     }

//     if (!newId) {
//       return res.status(500).json({ ok: false, message: "Failed to create branch" });
//     }

//     // ✅ Sync packages (optional: if you pass package_ids during create)
//     const ids = Array.isArray(package_ids)
//       ? package_ids.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)
//       : [];

//     if (ids.length > 0) {
//       if (isPg) {
//         const values = ids.map((_, i) => `($1, $${i + 2})`).join(", ");
//         const insSql = `INSERT INTO branch_package (branch_id, package_id) VALUES ${values}`;
//         await runQuery(db, insSql, [newId, ...ids]);
//       } else {
//         const values = ids.map(() => "(?, ?)").join(", ");
//         const params = ids.flatMap((pid) => [newId, pid]);
//         const insSql = `INSERT INTO branch_package (branch_id, package_id) VALUES ${values}`;
//         await runQuery(db, insSql, params);
//       }
//     }

//     return res.status(201).json({
//       ok: true,
//       message: "Branch created successfully",
//       data: { id: newId, branch_name: name, branch_code: code, status: safeStatus, package_ids: ids },
//     });
//   } catch (err) {
//     console.error("[createBranch] ERROR:", err);
//     return res.status(500).json({ ok: false, message: "Failed to create branch" });
//   }
// };
