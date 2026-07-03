// src/controllers/reportActivationController.js
const { getConnection, runQuery } = require("../db/connectionManager");
const ExcelJS = require("exceljs");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function selectInstallDate(dbType) {
  // Return YYYY-MM-DD string to avoid timezone shifting in Excel
  return dbType === "postgres"
    ? "TO_CHAR(DATE(a.install_date), 'YYYY-MM-DD') AS install_date"
    : "DATE_FORMAT(DATE(a.install_date), '%Y-%m-%d') AS install_date";
}

function isISODate(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function normalizeISODate(v) {
  if (!v) return null;
  return isISODate(v) ? v : null;
}

function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Build date WHERE clause for:
 * - period=day|week|month -> no params
 * - period=range -> uses start_date/end_date params
 *
 * Returns: { whereSql, params }
 */
function buildActivationDateFilter(dbType, period, startDate, endDate) {
  const p = (period || "day").toLowerCase();
  const start = normalizeISODate(startDate);
  const end = normalizeISODate(endDate);

  // Placeholders
  const ph = (i) => (dbType === "postgres" ? `$${i}` : `?`);

  // ✅ Custom range
  if (p === "range") {
    const params = [];
    const parts = [];
    let idx = 1;

    if (start) {
      parts.push(
        dbType === "postgres"
          ? `DATE(a.install_date) >= ${ph(idx)}::date`
          : `DATE(a.install_date) >= ${ph(idx)}`
      );
      params.push(start);
      idx++;
    }

    if (end) {
      parts.push(
        dbType === "postgres"
          ? `DATE(a.install_date) <= ${ph(idx)}::date`
          : `DATE(a.install_date) <= ${ph(idx)}`
      );
      params.push(end);
      idx++;
    }

    // If neither date valid -> fallback to today
    if (parts.length === 0) {
      return buildActivationDateFilter(dbType, "day");
    }

    return { whereSql: parts.join(" AND "), params };
  }

  // ✅ Preset periods
  if (dbType === "postgres") {
    switch (p) {
      case "week":
        return {
          whereSql: `
            DATE(a.install_date) >= CURRENT_DATE - INTERVAL '6 days'
            AND DATE(a.install_date) <= CURRENT_DATE
          `,
          params: [],
        };
      case "month":
        return {
          whereSql: `
            DATE_TRUNC('month', DATE(a.install_date)) = DATE_TRUNC('month', CURRENT_DATE)
          `,
          params: [],
        };
      case "day":
      default:
        return { whereSql: `DATE(a.install_date) = CURRENT_DATE`, params: [] };
    }
  }

  // MySQL/MariaDB
  switch (p) {
    case "week":
      return {
        whereSql: `
          DATE(a.install_date) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
          AND DATE(a.install_date) <= CURDATE()
        `,
        params: [],
      };
    case "month":
      return {
        whereSql: `
          YEAR(DATE(a.install_date)) = YEAR(CURDATE())
          AND MONTH(DATE(a.install_date)) = MONTH(CURDATE())
        `,
        params: [],
      };
    case "day":
    default:
      return { whereSql: `DATE(a.install_date) = CURDATE()`, params: [] };
  }
}

/**
 * For /subscriptions endpoints (date range without "period"):
 * If start/end missing -> fallback to this month (first day -> last day)
 */
function getCustomRangeOrThisMonth(req) {
  const s = normalizeISODate(req.query?.start_date);
  const e = normalizeISODate(req.query?.end_date);

  if (s && e) return { start: s, end: e };

  const now = new Date();
  const start = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
  const end = toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)); // last day of month
  return { start, end };
}

// ---------------------------------------------------------------------------
// TOTAL ACTIVATIONS (JSON) – Daily / Weekly / Monthly / Range
// ---------------------------------------------------------------------------
// exports.getTotalActivations = async (req, res) => {
//   try {
//     const dbType = process.env.DB_TYPE || "postgres";
//     const db = getConnection(dbType);

//     const period = (req.query.period || "day").toLowerCase();
//     const start_date = req.query.start_date;
//     const end_date = req.query.end_date;

//     const { whereSql, params } = buildActivationDateFilter(
//       dbType,
//       period,
//       start_date,
//       end_date
//     );

//     const sql = `
//       SELECT
//         a.id,
//         a.install_date,
//         a.install_time,
//         a.status,
//         a.customer_id,
//         a.package_id,
//         a.staff_id,
//         u.name  AS customer_name,
//         p.package_name AS package_name,
//         s2.name AS technician_name
//       FROM activation a
//       LEFT JOIN users   u  ON u.id = a.customer_id
//       LEFT JOIN package p  ON p.id = a.package_id
//       LEFT JOIN users   s2 ON s2.id = a.staff_id
//       WHERE ${whereSql}
//       ORDER BY a.install_date DESC, a.install_time DESC
//     `;

//     console.log("[getTotalActivations]", { period, start_date, end_date, params });

//     const rows = await runQuery(db, sql, params);
//     return res.json(rows || []);
//   } catch (err) {
//     console.error("Error in getTotalActivations:", err);
//     return res.status(500).json({
//       message: "Server error loading activations",
//       error: String(err),
//     });
//   }
// };
exports.getTotalActivations = async (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || "postgres";
    const db = getConnection(dbType);

    const period = (req.query.period || "day").toLowerCase();
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    const { whereSql, params } = buildActivationDateFilter(
      dbType,
      period,
      start_date,
      end_date
    );

    const sql = `
      SELECT
        a.id,
        ${selectInstallDate(dbType)},
        a.install_time,
        a.status,
        a.customer_id,
        a.package_id,
        a.staff_id,
        u.name  AS customer_name,
        p.package_name AS package_name,
        s2.name AS technician_name
      FROM activation a
      LEFT JOIN users   u  ON u.id = a.customer_id
      LEFT JOIN package p  ON p.id = a.package_id
      LEFT JOIN users   s2 ON s2.id = a.staff_id
      WHERE ${whereSql}
      ORDER BY a.install_date DESC, a.install_time DESC
    `;

    console.log("[getTotalActivations]", { period, start_date, end_date, params });

    const rows = await runQuery(db, sql, params);
    return res.json(rows || []);
  } catch (err) {
    console.error("Error in getTotalActivations:", err);
    return res.status(500).json({
      message: "Server error loading activations",
      error: String(err),
    });
  }
};



// ---------------------------------------------------------------------------
// TOTAL ACTIVATIONS (Excel) – Daily / Weekly / Monthly / Range
// ---------------------------------------------------------------------------
// exports.exportTotalActivationsExcel = async (req, res) => {
//   try {
//     const dbType = process.env.DB_TYPE || "postgres";
//     const db = getConnection(dbType);

//     const period = (req.query.period || "day").toLowerCase();
//     const start_date = req.query.start_date;
//     const end_date = req.query.end_date;

//     const { whereSql, params } = buildActivationDateFilter(
//       dbType,
//       period,
//       start_date,
//       end_date
//     );

//     const sql = `
//       SELECT
//         a.id,
//         a.install_date,
//         a.install_time,
//         a.status,
//         a.customer_id,
//         a.package_id,
//         a.staff_id,
//         u.name  AS customer_name,
//         p.package_name AS package_name,
//         s2.name AS technician_name
//       FROM activation a
//       LEFT JOIN users   u  ON u.id = a.customer_id
//       LEFT JOIN package p  ON p.id = a.package_id
//       LEFT JOIN users   s2 ON s2.id = a.staff_id
//       WHERE ${whereSql}
//       ORDER BY a.install_date DESC, a.install_time DESC
//     `;

//     console.log("[exportTotalActivationsExcel]", {
//       period,
//       start_date,
//       end_date,
//       params,
//     });

//     const rows = await runQuery(db, sql, params);

//     const workbook = new ExcelJS.Workbook();
//     const sheet = workbook.addWorksheet("Total Activations");

//     sheet.columns = [
//       { header: "ID", key: "id", width: 10 },
//       { header: "Customer", key: "customer_name", width: 30 },
//       { header: "Package", key: "package_name", width: 30 },
//       { header: "Technician", key: "technician_name", width: 25 },
//       { header: "Status", key: "status", width: 15 },
//       { header: "Install Date", key: "install_date", width: 15 },
//       { header: "Install Time", key: "install_time", width: 12 },
//     ];

//     (rows || []).forEach((row) => sheet.addRow(row));

//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       'attachment; filename="total-activations-report.xlsx"'
//     );

//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (err) {
//     console.error("Error in exportTotalActivationsExcel:", err);
//     return res.status(500).json({
//       message: "Server error exporting Excel for activations",
//       error: String(err),
//     });
//   }
// };
exports.exportTotalActivationsExcel = async (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || "postgres";
    const db = getConnection(dbType);

    const period = (req.query.period || "day").toLowerCase();
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    const { whereSql, params } = buildActivationDateFilter(
      dbType,
      period,
      start_date,
      end_date
    );

    const sql = `
      SELECT
        a.id,
        ${selectInstallDate(dbType)},
        a.install_time,
        a.status,
        a.customer_id,
        a.package_id,
        a.staff_id,
        u.name  AS customer_name,
        p.package_name AS package_name,
        s2.name AS technician_name
      FROM activation a
      LEFT JOIN users   u  ON u.id = a.customer_id
      LEFT JOIN package p  ON p.id = a.package_id
      LEFT JOIN users   s2 ON s2.id = a.staff_id
      WHERE ${whereSql}
      ORDER BY a.install_date DESC, a.install_time DESC
    `;

    console.log("[exportTotalActivationsExcel]", {
      period,
      start_date,
      end_date,
      params,
    });

    const rows = await runQuery(db, sql, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Total Activations");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Customer", key: "customer_name", width: 30 },
      { header: "Package", key: "package_name", width: 30 },
      { header: "Technician", key: "technician_name", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Install Date", key: "install_date", width: 15 },
      { header: "Install Time", key: "install_time", width: 12 },
    ];

    (rows || []).forEach((row) => {
      // ✅ If somehow still comes with time, hard-trim to date-only
      const installDate =
        typeof row.install_date === "string"
          ? row.install_date.slice(0, 10) // "YYYY-MM-DD"
          : "";

      sheet.addRow({
        ...row,
        install_date: installDate,
      });
    });


    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="total-activations-report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error in exportTotalActivationsExcel:", err);
    return res.status(500).json({
      message: "Server error exporting Excel for activations",
      error: String(err),
    });
  }
};


// ---------------------------------------------------------------------------
// TOTAL ACTIVATIONS BY PACKAGE (JSON) – Daily / Weekly / Monthly / Range
// ---------------------------------------------------------------------------
exports.getActivationsByPackage = async (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || "postgres";
    const db = getConnection(dbType);

    const period = (req.query.period || "day").toLowerCase();
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    const { whereSql, params } = buildActivationDateFilter(
      dbType,
      period,
      start_date,
      end_date
    );

    const sql = `
      SELECT
        a.package_id,
        COALESCE(p.package_name, 'Unknown Package') AS package_name,
        COUNT(*) AS total_activations,
        SUM(CASE WHEN UPPER(a.status) = 'COMPLETED' THEN 1 ELSE 0 END) AS total_completed,
        SUM(CASE WHEN UPPER(a.status) = 'PENDING'   THEN 1 ELSE 0 END) AS total_pending
      FROM activation a
      LEFT JOIN package p ON p.id = a.package_id
      WHERE a.package_id IS NOT NULL
        AND ${whereSql}
      GROUP BY a.package_id, p.package_name
      ORDER BY package_name ASC
    `;

    console.log("[getActivationsByPackage]", {
      period,
      start_date,
      end_date,
      params,
    });

    const rows = await runQuery(db, sql, params);
    return res.json(rows || []);
  } catch (err) {
    console.error("Error in getActivationsByPackage:", err);
    return res.status(500).json({
      message: "Server error loading activations by package",
      error: String(err),
    });
  }
};

// ---------------------------------------------------------------------------
// TOTAL ACTIVATIONS BY PACKAGE (Excel) – Daily / Weekly / Monthly / Range
// ---------------------------------------------------------------------------
exports.exportActivationsByPackageExcel = async (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || "postgres";
    const db = getConnection(dbType);

    const period = (req.query.period || "day").toLowerCase();
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    const { whereSql, params } = buildActivationDateFilter(
      dbType,
      period,
      start_date,
      end_date
    );

    const sql = `
      SELECT
        a.package_id,
        COALESCE(p.package_name, 'Unknown Package') AS package_name,
        COUNT(*) AS total_activations,
        SUM(CASE WHEN UPPER(a.status) = 'COMPLETED' THEN 1 ELSE 0 END) AS total_completed,
        SUM(CASE WHEN UPPER(a.status) = 'PENDING'   THEN 1 ELSE 0 END) AS total_pending
      FROM activation a
      LEFT JOIN package p ON p.id = a.package_id
      WHERE a.package_id IS NOT NULL
        AND ${whereSql}
      GROUP BY a.package_id, p.package_name
      ORDER BY package_name ASC
    `;

    console.log("[exportActivationsByPackageExcel]", {
      period,
      start_date,
      end_date,
      params,
    });

    const rows = await runQuery(db, sql, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Activations by Package");

    sheet.columns = [
      { header: "Package", key: "package_name", width: 30 },
      { header: "Total Activations", key: "total_activations", width: 18 },
      { header: "Completed", key: "total_completed", width: 15 },
      { header: "Pending", key: "total_pending", width: 15 },
    ];

    (rows || []).forEach((row) => sheet.addRow(row));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="activation-by-package-report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error in exportActivationsByPackageExcel:", err);
    return res.status(500).json({
      message: "Server error exporting Excel for activations by package",
      error: String(err),
    });
  }
};

// ---------------------------------------------------------------------------
// PACKAGE SUBSCRIPTIONS (DATE RANGE) – JSON + Excel
// ---------------------------------------------------------------------------

exports.getActivationsByPackageDate = async (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || "postgres";
    const db = getConnection(dbType);

    const { start, end } = getCustomRangeOrThisMonth(req);

    const params = [start, end];
    const whereSql =
      dbType === "postgres"
        ? `DATE(a.install_date) >= $1::date AND DATE(a.install_date) <= $2::date`
        : `DATE(a.install_date) >= ? AND DATE(a.install_date) <= ?`;

    const sql = `
      SELECT
        p.id           AS package_id,
        p.package_name AS package_name,
        COUNT(*)       AS total_activations,
        SUM(CASE WHEN UPPER(a.status) = 'COMPLETED' THEN 1 ELSE 0 END) AS total_completed,
        SUM(CASE WHEN UPPER(a.status) = 'PENDING'   THEN 1 ELSE 0 END) AS total_pending,
        MIN(a.install_date) AS first_install_date,
        MAX(a.install_date) AS last_install_date
      FROM activation a
      JOIN package p ON p.id = a.package_id
      WHERE a.package_id IS NOT NULL
        AND ${whereSql}
      GROUP BY p.id, p.package_name
      ORDER BY p.package_name ASC
    `;

    console.log("[getActivationsByPackageDate] range=", start, "→", end);

    const rows = await runQuery(db, sql, params);
    return res.json(rows || []);
  } catch (err) {
    console.error("Error in getActivationsByPackageDate:", err);
    return res.status(500).json({
      message: "Server error loading activations by package/date",
      error: String(err),
    });
  }
};

exports.exportActivationsByPackageDateExcel = async (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || "postgres";
    const db = getConnection(dbType);

    const { start, end } = getCustomRangeOrThisMonth(req);

    const params = [start, end];
    const whereSql =
      dbType === "postgres"
        ? `DATE(a.install_date) >= $1::date AND DATE(a.install_date) <= $2::date`
        : `DATE(a.install_date) >= ? AND DATE(a.install_date) <= ?`;

    const sql = `
      SELECT
        p.id           AS package_id,
        p.package_name AS package_name,
        COUNT(*)       AS total_activations,
        SUM(CASE WHEN UPPER(a.status) = 'COMPLETED' THEN 1 ELSE 0 END) AS total_completed,
        SUM(CASE WHEN UPPER(a.status) = 'PENDING'   THEN 1 ELSE 0 END) AS total_pending,
        MIN(a.install_date) AS first_install_date,
        MAX(a.install_date) AS last_install_date
      FROM activation a
      JOIN package p ON p.id = a.package_id
      WHERE a.package_id IS NOT NULL
        AND ${whereSql}
      GROUP BY p.id, p.package_name
      ORDER BY p.package_name ASC
    `;

    console.log("[exportActivationsByPackageDateExcel] range=", start, "→", end);

    const rows = await runQuery(db, sql, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Activations By Package");

    sheet.columns = [
      { header: "Package", key: "package_name", width: 30 },
      { header: "Total", key: "total_activations", width: 12 },
      { header: "Completed", key: "total_completed", width: 12 },
      { header: "Pending", key: "total_pending", width: 12 },
      { header: "First Install", key: "first_install_date", width: 18 },
      { header: "Last Install", key: "last_install_date", width: 18 },
    ];

    (rows || []).forEach((row) => sheet.addRow(row));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="activations-by-package-date.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error in exportActivationsByPackageDateExcel:", err);
    return res.status(500).json({
      message: "Server error exporting Excel for activations by package/date",
      error: String(err),
    });
  }
};
