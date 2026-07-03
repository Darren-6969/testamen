// src/controllers/reportCustomerController.js
const { getConnection, runQuery } = require('../db/connectionManager');
const ExcelJS = require('exceljs');

const MY_TZ = 'Asia/Kuala_Lumpur';

function isISODate(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function normalizeISODate(v) {
  return isISODate(v) ? v : null;
}


/**
 * Build created_at filter for period: day | week | month | range
 * Returns: { whereSql, params }
 *
 * ✅ Important:
 * - We filter by DATE in Malaysia timezone to match UI expectations.
 * - We use params to avoid SQL injection.
 */
function buildCustomerCreatedAtFilter(dbType, period, startDate, endDate) {
  const p = (period || 'day').toLowerCase();

  // Postgres (your SQL already uses date_trunc + interval)
  if (dbType === 'postgres') {
    if (p === 'range') {
      const s = normalizeISODate(startDate);
      const e = normalizeISODate(endDate);

      // If dates invalid/missing, fallback to no filter (status_id only)
      if (!s || !e) {
        return { whereSql: `u.status_id = 2`, params: [] };
      }

      // Malaysia timezone date comparison
      return {
        whereSql: `
          u.status_id = 2
          AND ((u.created_at AT TIME ZONE '${MY_TZ}')::date >= $1::date)
          AND ((u.created_at AT TIME ZONE '${MY_TZ}')::date <= $2::date)
        `,
        params: [s, e],
      };
    }

    if (p === 'day') {
      return {
        whereSql: `
          u.status_id = 2
          AND ((u.created_at AT TIME ZONE '${MY_TZ}')::date = (NOW() AT TIME ZONE '${MY_TZ}')::date)
        `,
        params: [],
      };
    }

    if (p === 'week') {
      return {
        whereSql: `
          u.status_id = 2
          AND ((u.created_at AT TIME ZONE '${MY_TZ}')::date >= ((NOW() AT TIME ZONE '${MY_TZ}')::date - INTERVAL '6 days'))
          AND ((u.created_at AT TIME ZONE '${MY_TZ}')::date <= (NOW() AT TIME ZONE '${MY_TZ}')::date)
        `,
        params: [],
      };
    }

    if (p === 'month') {
      return {
        whereSql: `
          u.status_id = 2
          AND DATE_TRUNC('month', (u.created_at AT TIME ZONE '${MY_TZ}')) =
              DATE_TRUNC('month', (NOW() AT TIME ZONE '${MY_TZ}'))
        `,
        params: [],
      };
    }

    // fallback
    return { whereSql: `u.status_id = 2`, params: [] };
  }

  // MySQL fallback
  if (p === 'range') {
    const s = normalizeISODate(startDate);
    const e = normalizeISODate(endDate);
    if (!s || !e) return { whereSql: `u.status_id = 2`, params: [] };

    return {
      whereSql: `u.status_id = 2 AND DATE(u.created_at) >= ? AND DATE(u.created_at) <= ?`,
      params: [s, e],
    };
  }

  if (p === 'week') {
    return {
      whereSql: `u.status_id = 2 AND DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND DATE(u.created_at) <= CURDATE()`,
      params: [],
    };
  }

  if (p === 'month') {
    return {
      whereSql: `u.status_id = 2 AND YEAR(u.created_at)=YEAR(CURDATE()) AND MONTH(u.created_at)=MONTH(CURDATE())`,
      params: [],
    };
  }

  // day default
  return {
    whereSql: `u.status_id = 2 AND DATE(u.created_at) = CURDATE()`,
    params: [],
  };
}

/**
 * ✅ For Excel/UI stability:
 * Return created_at as a formatted string in Malaysia time.
 */
function selectCreatedAt(dbType) {
  if (dbType === 'postgres') {
    return `TO_CHAR((u.created_at AT TIME ZONE '${MY_TZ}'), 'YYYY-MM-DD HH24:MI:SS') AS created_at`;
  }
  // MySQL
  return `DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') AS created_at`;
}

/**
 * TOTAL CUSTOMER STATUS LIST (Active / Inactive / Pending)
 * 
 * Uses:
 *  - users       table: u
 *  - customer    table: c   (joined on c.user_id = u.id)
 *
 * EXPECTED columns (please adjust if different):
 *  - users.id
 *  - users.name
 *  - users.email
 *  - users.phone              (if you don't have this, we alias '' AS phone)
 *  - users.status_id          (we filter status_id = 2 here, same as your getCustomers)
 *  - customer.status          (text: ACTIVE / INACTIVE / PENDING)
 */
exports.getCustomerStatusList = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        c.contact_no AS phone,                -- 🔁 change if your phone column is different
        COALESCE(u.acc_status, 'UNKNOWN') AS status
      FROM users u
      LEFT JOIN customer c ON c.user_id = u.id   -- 🔁 ensure customer.user_id exists
      WHERE u.status_id = 2                      -- 🔁 same as your getCustomers
      ORDER BY u.name ASC
    `;

    const rows = await runQuery(db, sql, []);
    return res.json(rows || []);
  } catch (err) {
    console.error('Error in getCustomerStatusList:', err);
    return res
      .status(500)
      .json({ message: 'Server error loading customer list', error: String(err) });
  }
};

/**
 * TOTAL CUSTOMER STATUS EXCEL (with optional ?status=ACTIVE/INACTIVE/PENDING/ALL)
 */
exports.exportCustomerStatusExcel = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const statusFilter = (req.query.status || 'ALL').toUpperCase();

    let whereExtra = '';
    if (statusFilter !== 'ALL') {
      whereExtra = ` AND UPPER(COALESCE(u.acc_status, 'UNKNOWN')) = '${statusFilter}' `;
    }

    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        c.contact_no AS phone,
        COALESCE(u.acc_status, 'UNKNOWN') AS status
      FROM users u
      LEFT JOIN customer c ON c.user_id = u.id
      WHERE u.status_id = 2
      ${whereExtra}
      ORDER BY u.name ASC
    `;

    const rows = await runQuery(db, sql, []);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Customers');

    sheet.columns = [
      { header: 'ID',     key: 'id',     width: 10 },
      { header: 'Name',   key: 'name',   width: 30 },
      { header: 'Email',  key: 'email',  width: 30 },
      { header: 'Phone',  key: 'phone',  width: 18 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    (rows || []).forEach((row) => sheet.addRow(row));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="customer-status-report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error in exportCustomerStatusExcel:', err);
    return res
      .status(500)
      .json({ message: 'Server error exporting Excel', error: String(err) });
  }
};


// ---------------------------------------------------------------------------
// NEW CUSTOMERS (DAY / WEEK / MONTH)
// ---------------------------------------------------------------------------

// Helper → compute date range by period (day | week | month)
// function getPeriodRange(period) {
//   const now = new Date();
//   const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   let end;

//   switch ((period || '').toLowerCase()) {
//     case 'day':
//     default:
//       // today
//       end = new Date(start);
//       end.setDate(end.getDate() + 1);
//       break;

//     case 'week':
//       // last 7 days (including today)
//       end = new Date(start);
//       end.setDate(end.getDate() + 1);      // tomorrow
//       start.setDate(start.getDate() - 6);  // 7 days window
//       break;

//     case 'month':
//       // this month
//       end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
//       start.setDate(1);
//       break;
//   }

//   const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
//   const endStr   = end.toISOString().slice(0, 19).replace('T', ' ');
//   return { start: startStr, end: endStr };
// }

exports.getNewCustomerList = async (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || 'postgres';
    const db = getConnection(dbType);

    const period = (req.query.period || 'day').toLowerCase();
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    const { whereSql, params } = buildCustomerCreatedAtFilter(
      dbType,
      period,
      start_date,
      end_date
    );

    const sql = `
      SELECT
        u.id,
        u.name,
        u.email,
        c.contact_no AS phone,
        COALESCE(u.acc_status, 'UNKNOWN') AS status,
        ${selectCreatedAt(dbType)}
      FROM users u
      LEFT JOIN customer c ON c.user_id = u.id
      WHERE ${whereSql}
      ORDER BY u.created_at DESC
    `;

    console.log('[getNewCustomerList]', { period, start_date, end_date, params });

    const rows = await runQuery(db, sql, params);
    return res.json(rows || []);
  } catch (err) {
    console.error('Error in getNewCustomerList:', err);
    return res.status(500).json({
      message: 'Server error loading new customers',
      error: String(err),
    });
  }
};


exports.exportNewCustomerExcel = async (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || 'postgres';
    const db = getConnection(dbType);

    const period = (req.query.period || 'day').toLowerCase();
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    const { whereSql, params } = buildCustomerCreatedAtFilter(
      dbType,
      period,
      start_date,
      end_date
    );

    const sql = `
      SELECT
        u.id,
        u.name,
        u.email,
        c.contact_no AS phone,
        COALESCE(u.acc_status, 'UNKNOWN') AS status,
        ${selectCreatedAt(dbType)}
      FROM users u
      LEFT JOIN customer c ON c.user_id = u.id
      WHERE ${whereSql}
      ORDER BY u.created_at DESC
    `;

    console.log('[exportNewCustomerExcel]', { period, start_date, end_date, params });

    const rows = await runQuery(db, sql, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('New Customers');

    sheet.columns = [
      { header: 'ID',         key: 'id',         width: 10 },
      { header: 'Name',       key: 'name',       width: 30 },
      { header: 'Email',      key: 'email',      width: 30 },
      { header: 'Phone',      key: 'phone',      width: 18 },
      { header: 'Status',     key: 'status',     width: 12 },
      { header: 'Created At', key: 'created_at', width: 22 },
    ];

    // ✅ Force Created At to stay as TEXT (prevents Excel/timezone reinterpretation)
    sheet.getColumn('created_at').numFmt = '@';

    (rows || []).forEach((row) => sheet.addRow(row));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="new-customers-report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error in exportNewCustomerExcel:', err);
    return res.status(500).json({
      message: 'Server error exporting Excel for new customers',
      error: String(err),
    });
  }
};


// ---------------------------------------------------------------------------
// TOTAL CUSTOMERS BY PACKAGE
// ---------------------------------------------------------------------------

/**
 * JSON summary: total customers grouped by package
 *
 * Tables:
 *  - users u         (status_id = 2)
 *  - customer c      (c.user_id = u.id)
 *  - package p       (p.id = c.package)
 *
 * Adjust p.package_name if your column is different (e.g. p.package_name).
 */
exports.getCustomerByPackageSummary = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    // ✅ Customers by Package (exclude "no package")
    const sql = `
      SELECT
        p.id AS package_id,
        p.package_name AS package_name,  -- no more COALESCE
        CAST(COUNT(u.id) AS INTEGER) AS total_customers,
        CAST(
          SUM(
            CASE
              WHEN UPPER(COALESCE(u.acc_status, 'UNKNOWN')) = 'ACTIVE'
              THEN 1 ELSE 0
            END
          ) AS INTEGER
        ) AS active_customers,
        CAST(
          SUM(
            CASE
              WHEN UPPER(COALESCE(u.acc_status, 'UNKNOWN')) = 'INACTIVE'
              THEN 1 ELSE 0
            END
          ) AS INTEGER
        ) AS inactive_customers,
        CAST(
          SUM(
            CASE
              WHEN UPPER(COALESCE(u.acc_status, 'UNKNOWN')) = 'PENDING'
              THEN 1 ELSE 0
            END
          ) AS INTEGER
        ) AS pending_customers
      FROM users u
      LEFT JOIN customer c ON c.user_id = u.id
      LEFT JOIN package p ON p.id = c.package
      WHERE u.status_id = 2
        AND c.package IS NOT NULL          -- 🔴 exclude "no package"
        AND p.id IS NOT NULL               -- extra safety
      GROUP BY p.id, p.package_name
      ORDER BY p.id ASC
    `;

    const rows = await runQuery(db, sql);
    return res.json(rows || []);
  } catch (err) {
    console.error('Error in getCustomerByPackageSummary:', err);
    return res.status(500).json({
      message: 'Server error loading customers by package',
      error: String(err),
    });
  }
};

/**
 * Excel export: customers grouped by package
 */
exports.exportCustomerByPackageExcel = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    // ✅ Customers by Package (exclude "no package")
    const sql = `
      SELECT
        p.id AS package_id,
        p.package_name AS package_name,  -- no more COALESCE
        CAST(COUNT(u.id) AS INTEGER) AS total_customers,
        CAST(
          SUM(
            CASE
              WHEN UPPER(COALESCE(u.acc_status, 'UNKNOWN')) = 'ACTIVE'
              THEN 1 ELSE 0
            END
          ) AS INTEGER
        ) AS active_customers,
        CAST(
          SUM(
            CASE
              WHEN UPPER(COALESCE(u.acc_status, 'UNKNOWN')) = 'INACTIVE'
              THEN 1 ELSE 0
            END
          ) AS INTEGER
        ) AS inactive_customers,
        CAST(
          SUM(
            CASE
              WHEN UPPER(COALESCE(u.acc_status, 'UNKNOWN')) = 'PENDING'
              THEN 1 ELSE 0
            END
          ) AS INTEGER
        ) AS pending_customers
      FROM users u
      LEFT JOIN customer c ON c.user_id = u.id
      LEFT JOIN package p ON p.id = c.package
      WHERE u.status_id = 2
        AND c.package IS NOT NULL          -- 🔴 exclude "no package"
        AND p.id IS NOT NULL               -- extra safety
      GROUP BY p.id, p.package_name
      ORDER BY p.id ASC
    `;

    const rows = await runQuery(db, sql);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Customers by Package');

    sheet.columns = [
      { header: 'Package ID',      key: 'package_id',      width: 12 },
      { header: 'Package Name',    key: 'package_name',    width: 30 },
      { header: 'Total Customers', key: 'total_customers', width: 18 },
      { header: 'Active',          key: 'active_customers', width: 12 },
      { header: 'Inactive',        key: 'inactive_customers', width: 12 },
      { header: 'Pending',         key: 'pending_customers', width: 12 },
    ];

    (rows || []).forEach((row) => sheet.addRow(row));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="customers-by-package.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error in exportCustomerByPackageExcel:', err);
    return res.status(500).json({
      message: 'Server error exporting Excel (by package)',
      error: String(err),
    });
  }
};
