// src/controllers/packagesMobileController.js
const { getConnection, runQuery } = require("../db/connectionManager");

function mapPackageRow(r) {
  return {
    id: Number(r.id),
    package_code: String(r.package_code ?? ""),
    package_name: String(r.package_name ?? ""),
    remarks: r.remarks ?? null,
    monthly_fee: Number(r.monthly_fee ?? 0),
  };
}

// GET /api/packages/mobile/list
exports.listPackages = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const rows = await runQuery(
      db,
      `
      SELECT id, package_code, package_name, remarks, monthly_fee
      FROM package
      ORDER BY id ASC;
      `,
      []
    );

    return res.json((rows || []).map(mapPackageRow));
  } catch (e) {
    return res
      .status(500)
      .json({ message: e?.message || "Failed to load packages" });
  }
};

// GET /api/packages/mobile/current
exports.getCurrentPackage = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    // ✅ must come from verifyToken middleware
    const authCustomerCode = String(
      req.user?.customer_code || req.user?.customerCode || ""
    ).trim();

    const authUserId = req.user?.userId || req.user?.id || null;

    if (!authCustomerCode && !authUserId) {
      return res.status(401).json({ message: "User not found!" });
    }

    // 1) Get current customer + package id from customer."package"
    let customer = null;

    if (authCustomerCode) {
      const rows = await runQuery(
        db,
        `
        SELECT c.id, c.customer_code, c."package" AS package_id
        FROM customer c
        WHERE c.customer_code = $1
        LIMIT 1;
        `,
        [authCustomerCode]
      );
      customer = rows?.[0] || null;
    } else {
      const rows = await runQuery(
        db,
        `
        SELECT c.id, c.customer_code, c."package" AS package_id
        FROM users u
        LEFT JOIN customer c ON c.user_id = u.id
        WHERE u.id = $1
        LIMIT 1;
        `,
        [authUserId]
      );
      customer = rows?.[0] || null;
    }

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const packageId = Number(customer.package_id || 0);
    if (!packageId) {
      return res.status(404).json({ message: "Customer has no package assigned" });
    }

    // 2) Load package row by id
    const pkgRows = await runQuery(
      db,
      `
      SELECT id, package_code, package_name, add_remarks AS remarks, monthly_fee
      FROM package
      WHERE id = $1
      LIMIT 1;
      `,
      [packageId]
    );

    const pkgRow = pkgRows?.[0] || null;
    if (!pkgRow) {
      return res.status(404).json({ message: "Package not found" });
    }

    return res.json(mapPackageRow(pkgRow));
  } catch (err) {
    console.error("Error in getCurrentPackage:", err);
    next?.(err) ||
      res.status(500).json({ message: err?.message || "Failed to load current package" });
  }
};


exports.getPackages = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      SELECT
        id,
        package_code,
        package_name,
        remarks,
        monthly_fee,
        type_internet
      FROM package
      ORDER BY package_name ASC
    `;

    const rows = await runQuery(db, sql, []);
    return res.json({ ok: true, data: rows || [] });
  } catch (err) {
    console.error("[getPackages] ERROR:", err);
    return res.status(500).json({ ok: false, message: "Failed to load packages" });
  }
};