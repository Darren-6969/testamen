const { getConnection, runQuery } = require('../db/connectionManager');

// ============================================================================
//                       Get Service Data
// ============================================================================
exports.getServiceData = async (req, res, next) => {
  try {
    // get DB connection (e.g. mysql / postgres based on env)
    const db = getConnection(process.env.DB_TYPE);

    // SQL:
    // package: id, name
    // customer: column "package" stores package.id
    const sql = `
      SELECT 
        p.id,
        p.package_name AS name,
        COUNT(c.id) AS value
      FROM package AS p
      LEFT JOIN customer AS c
        ON c.package = p.id
      GROUP BY p.id, p.package_name
      ORDER BY value DESC
    `;

    const rows = await runQuery(db, sql, []);

    // Return minimal shape: { name, value }
    const data = rows.map(r => ({
      name: r.name,
      value: Number(r.value || 0),
    }));

    return res.json(data);
  } catch (err) {
    console.error('Error in getServiceData:', err);
    next(err);
  }
};

// ============================================================================
//              Get New Customers (monthly, current year)
// ============================================================================
exports.getNewCustomersMonthly = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    // 👉 Postgres-style query (adjust if you're on MySQL)
    const sql = `
      SELECT 
        EXTRACT(MONTH FROM created_at)::int AS month,
        COUNT(*) AS total
      FROM users
      WHERE status_id = 2
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY month
      ORDER BY month;
    `;

    const rows = await runQuery(db, sql, []);

    const data = rows.map(r => ({
      month: Number(r.month),
      total: Number(r.total || 0),
    }));

    return res.json(data);
  } catch (err) {
    console.error('Error in getNewCustomersMonthly:', err);
    next(err);
  }
};


// ============================================================================
//              Get latest 2 new customers (status_id = 2)
// ============================================================================
exports.getLatestNewCustomers = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    // 🔹 Adjust column names if needed:
    //  - u.full_name  -> your name column (maybe 'name' instead)
    //  - u.phone_number -> your phone column
    //  - u.package -> FK to package.id
    const sql = `
      SELECT 
        u.id,
        u.name AS name,
        c.contact_no AS phone,
		p.package_name AS pkg,
        u.created_at
      FROM users AS u
      LEFT JOIN customer AS c ON c.user_id = u.id
	  LEFT JOIN package AS p ON p.id = c.package
      WHERE u.status_id = 2
      ORDER BY u.id DESC
      LIMIT 2
    `;

    const rows = await runQuery(db, sql, []);

    return res.json(rows);
  } catch (err) {
    console.error('Error in getLatestNewCustomers:', err);
    next(err);
  }
};

// ============================================================================
//              Dashboard summary (cards)
// ============================================================================
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    // 🔹 POSTGRES version:
    const sqlNewReg = `
      SELECT COUNT(*) AS total
      FROM users
      WHERE status_id = 2
        AND created_at >= (CURRENT_DATE - INTERVAL '30 days')
    `;

    const rowsNew = await runQuery(db, sqlNewReg, []);

    const newRegistrationsLast30 = Number(rowsNew[0]?.total || 0);

    // if later you want pending payment count, you can add another query here
    const sqlPending = `SELECT COUNT(*) AS total FROM payment_pending WHERE status = 'PENDING APPROVAL'`;
    const rowsPend = await runQuery(db, sqlPending, []);
    const pendingPayments = Number(rowsPend[0]?.total || 0);

    return res.json({
      newRegistrationsLast30,
      pendingPayments,
    });
  } catch (err) {
    console.error('Error in getDashboardSummary:', err);
    next(err);
  }
};

// ============================================================================
//              Installation status (Pending / Completed)
// ============================================================================
exports.getInstallationStatus = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      SELECT status, COUNT(*) AS total
      FROM activation
      WHERE status IN ('Pending', 'Completed')
      GROUP BY status
    `;

    const rows = await runQuery(db, sql, []);

    let pending = 0;
    let completed = 0;

    rows.forEach((row) => {
      const s = String(row.status).toLowerCase();
      if (s === 'pending') pending = Number(row.total || 0);
      if (s === 'completed') completed = Number(row.total || 0);
    });

    return res.json({ pending, completed });
  } catch (err) {
    console.error('Error in getInstallationStatus:', err);
    next(err);
  }
};

// ============================================================================
//                    Pending payments list for dashboard
// ============================================================================
exports.getPendingPaymentsList = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      SELECT
        pp.id,
        pp.reference_no,
        u.name AS customer_name,
        pp.amount,
        pp.created_at
      FROM payment_pending pp
      JOIN customer c
        ON c.customer_code = pp.customer_code
      JOIN users u
        ON u.id = c.user_id
      WHERE pp.status IN ('PENDING APPROVAL', 'PENDING POSTING')
      ORDER BY pp.created_at DESC
      LIMIT 2`;

    const rows = await runQuery(db, sql, []);

    return res.json(rows);
  } catch (err) {
    console.error('Error in getPendingPaymentsList:', err);
    next(err);
  }
};