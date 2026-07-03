// controllers/paymentReportController.js
const { getConnection, runQuery } = require("../db/connectionManager");
const ExcelJS = require("exceljs");

const TABLE = "payment_pending";

function toInt(val, fallback) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}
function s(val) {
  if (val === undefined || val === null) return null;
  const t = String(val).trim();
  return t ? t : null;
}


function normalizePeriod(p) {
  const v = String(p || "").toLowerCase();
  if (v === "week") return "week";
  if (v === "month") return "month";
  return "day";
}


function s(v){ return v==null ? null : String(v).trim() || null; }
function toInt(v, f){ const n=Number(v); return Number.isFinite(n)? n : f; }

function buildWhere(src) {
  const where = [];
  const params = [];
  let i = 1;

  const start_date = s(src.start_date);
  const end_date   = s(src.end_date);
  const search     = s(src.search);
  const status     = s(src.status);

  if (start_date) {
    where.push(`p.created_at::date >= $${i}::date`);
    params.push(start_date);
    i++;
  }
  if (end_date) {
    where.push(`p.created_at::date <= $${i}::date`);
    params.push(end_date);
    i++;
  }
  if (status) {
    where.push(`p.status = $${i}`);
    params.push(status);
    i++;
  }
  if (search) {
    where.push(`(
      LOWER(COALESCE(u.name,'')) LIKE LOWER($${i})
      OR LOWER(COALESCE(p.reference_no,'')) LIKE LOWER($${i})
      OR LOWER(COALESCE(p.customer_code,'')) LIKE LOWER($${i})
      OR LOWER(COALESCE(p.gateway_ref,'')) LIKE LOWER($${i})
      OR LOWER(COALESCE(p.payment_method,'')) LIKE LOWER($${i})
    )`);
    params.push(`%${search}%`);
    i++;
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

// ✅ EXPORT LISTING (same columns as UI)
exports.exportTotalPaymentExcel = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const src = req.query || {};

    const { whereSql, params } = buildWhere(src);

    // ✅ USE THE SAME LISTING QUERY YOU USE IN getTotalPayment (NO LIMIT/OFFSET)
    const sql = `
      SELECT
        p.created_at,
        u.name AS customer_name,
        p.payment_date,
        p.amount,
        p.reference_no,
        p.status
      FROM payment_pending p
      LEFT JOIN customer c ON c.customer_code = p.customer_code
      LEFT JOIN users u ON u.id = c.user_id
      ${whereSql}
      ORDER BY p.created_at DESC
    `;

    const rows = await runQuery(db, sql, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Total Payment");

    ws.columns = [
      { header: "Created Date",   key: "created_at",    width: 22 },
      { header: "Customer Name",  key: "customer_name", width: 24 },
      { header: "Payment Date",   key: "payment_date",  width: 14 },
      { header: "Payment Amount", key: "amount",        width: 16 },
      { header: "Reference No",   key: "reference_no",  width: 22 },
      { header: "Status",         key: "status",        width: 18 },
    ];

    rows.forEach(r => {
      ws.addRow({
        created_at: r.created_at,
        customer_name: r.customer_name,
        payment_date: r.payment_date,
        amount: Number(r.amount ?? 0),
        reference_no: r.reference_no,
        status: r.status,
      });
    });

    // optional: formatting
    ws.getRow(1).font = { bold: true };
    ws.getColumn("D").numFmt = '#,##0.00';

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="total-payment.xlsx"'
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ exportTotalPaymentExcel error:", err);
    return res.status(500).json({ message: "Failed to export Excel", error: err.message });
  }
};

// GET /api/report/payment/total
exports.getTotalPayment = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const src = req.query || {};

    const page = Math.max(1, toInt(src.page, 1));
    const limit = Math.min(200, Math.max(1, toInt(src.limit, 10)));
    const offset = (page - 1) * limit;

    const start_date = s(src.start_date);
    const end_date = s(src.end_date);
    const status = s(src.status);
    const search = s(src.search);

    const where = [];
    const params = [];
    let i = 1;

    // ✅ Date range (by KL date, inclusive)
    // created_at assumed timestamptz / timestamp
    if (start_date) {
      where.push(`(p.created_at AT TIME ZONE 'Asia/Kuala_Lumpur')::date >= $${i++}::date`);
      params.push(start_date);
    }
    if (end_date) {
      where.push(`(p.created_at AT TIME ZONE 'Asia/Kuala_Lumpur')::date <= $${i++}::date`);
      params.push(end_date);
    }

    if (status) {
      where.push(`UPPER(COALESCE(p.status,'')) = UPPER($${i++})`);
      params.push(status);
    }

    if (search) {
      where.push(`
        (
          LOWER(COALESCE(u.name,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(p.reference_no,'')) LIKE LOWER($${i})
        )
      `.trim());
      params.push(`%${search}%`);
      i++;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ✅ COUNT
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM payment_pending p
      LEFT JOIN customer c ON c.customer_code = p.customer_code
      LEFT JOIN users u ON u.id = c.user_id
      ${whereSql}
    `;
    const countRows = await runQuery(db, countSql, params);
    const total = countRows?.[0]?.total ?? 0;

    // ✅ LIST
    const listSql = `
      SELECT
        p.id,
        p.created_at,
        u.name AS customer_name,
        p.payment_date,
        p.amount,
        p.reference_no,
        p.status
      FROM payment_pending p
      LEFT JOIN customer c ON c.customer_code = p.customer_code
      LEFT JOIN users u ON u.id = c.user_id
      ${whereSql}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT $${i} OFFSET $${i + 1}
    `;

    const rows = await runQuery(db, listSql, [...params, limit, offset]);

    return res.json({
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
      rows: rows || [],
    });
  } catch (err) {
    console.error("❌ getTotalPayment error:", err);
    return res.status(500).json({
      message: "Failed to load total payment",
      error: err.message,
    });
  }
};


// helper
function s(val) {
  if (val === undefined || val === null) return null;
  const t = String(val).trim();
  return t ? t : null;
}

exports.getPaymentStatusSummary = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const start_date = s(req.query.start_date);
    const end_date = s(req.query.end_date);
    const search = s(req.query.search);

    const where = [];
    const params = [];
    let i = 1;

    // ✅ inclusive date range in KL, compare on created_at
    if (start_date) {
      where.push(
        `created_at >= (($${i++}::date)::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')`
      );
      params.push(start_date);
    }

    if (end_date) {
      where.push(
        `created_at < (((($${i++}::date) + INTERVAL '1 day')::timestamp) AT TIME ZONE 'Asia/Kuala_Lumpur')`
      );
      params.push(end_date);
    }

    if (search) {
      where.push(`
        (
          LOWER(COALESCE(customer_code,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(reference_no,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(gateway_ref,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(gateway_txn_id,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(payment_method,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(gateway_provider,'')) LIKE LOWER($${i})
        )
      `.trim());
      params.push(`%${search}%`);
      i++;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT
        COALESCE(status, 'UNKNOWN') AS status,
        COUNT(*)::int AS total_records,
        COALESCE(SUM(amount), 0)::numeric(14,2) AS total_amount
      FROM ${TABLE}
      ${whereSql}
      GROUP BY COALESCE(status, 'UNKNOWN')
      ORDER BY total_records DESC, status ASC
    `;

    const rows = await runQuery(db, sql, params);
    return res.json(rows || []);
  } catch (err) {
    console.error("❌ getPaymentStatusSummary error:", err);
    return res.status(500).json({
      message: "Failed to load payment status summary",
      error: err.message,
    });
  }
};

exports.exportPaymentStatusSummaryExcel = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const start_date = s(req.query.start_date);
    const end_date = s(req.query.end_date);
    const search = s(req.query.search);

    // reuse same query logic
    const where = [];
    const params = [];
    let i = 1;

    if (start_date) {
      where.push(
        `created_at >= (($${i++}::date)::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')`
      );
      params.push(start_date);
    }
    if (end_date) {
      where.push(
        `created_at < (((($${i++}::date) + INTERVAL '1 day')::timestamp) AT TIME ZONE 'Asia/Kuala_Lumpur')`
      );
      params.push(end_date);
    }
    if (search) {
      where.push(`
        (
          LOWER(COALESCE(customer_code,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(reference_no,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(gateway_ref,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(gateway_txn_id,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(payment_method,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(gateway_provider,'')) LIKE LOWER($${i})
        )
      `.trim());
      params.push(`%${search}%`);
      i++;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT
        COALESCE(status, 'UNKNOWN') AS status,
        COUNT(*)::int AS total_records,
        COALESCE(SUM(amount), 0)::numeric(14,2) AS total_amount
      FROM ${TABLE}
      ${whereSql}
      GROUP BY COALESCE(status, 'UNKNOWN')
      ORDER BY total_records DESC, status ASC
    `;

    const rows = await runQuery(db, sql, params);

    // ✅ build excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Status Summary");

    ws.columns = [
      { header: "Status", key: "status", width: 24 },
      { header: "Total Records", key: "total_records", width: 16 },
      { header: "Total Amount (RM)", key: "total_amount", width: 18 },
    ];

    (rows || []).forEach((r) => {
      ws.addRow({
        status: r.status,
        total_records: Number(r.total_records ?? 0),
        total_amount: Number(r.total_amount ?? 0),
      });
    });

    ws.getRow(1).font = { bold: true };
    ws.getColumn(2).alignment = { horizontal: "right" };
    ws.getColumn(3).alignment = { horizontal: "right" };
    ws.getColumn(3).numFmt = "#,##0.00";

    const fileName = `payment_status_summary_${start_date || "all"}_${end_date || "all"}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ exportPaymentStatusSummaryExcel error:", err);
    return res.status(500).json({
      message: "Failed to export payment status summary",
      error: err.message,
    });
  }
};

// GET /api/report/payment/total/excel
// exports.exportTotalPaymentExcel = async (req, res) => {
//   try {
//     const db = getConnection(process.env.DB_TYPE);

//     const period = normalizePeriod(req.query.period);
//     const start_date = s(req.query.start_date);
//     const end_date = s(req.query.end_date);
//     const q = s(req.query.search);
//     const status = s(req.query.status);

//     const where = [`deleted_at IS NULL`];
//     const params = [];
//     let i = 2; // $1 is period

//     if (status) {
//       where.push(`status = $${i++}`);
//       params.push(status);
//     }
//     if (start_date) {
//       where.push(`payment_date >= $${i++}::date`);
//       params.push(start_date);
//     }
//     if (end_date) {
//       where.push(`payment_date <= $${i++}::date`);
//       params.push(end_date);
//     }
//     if (q) {
//       where.push(`
//         (
//           LOWER(COALESCE(customer_code,'')) LIKE LOWER($${i})
//           OR LOWER(COALESCE(reference_no,'')) LIKE LOWER($${i})
//           OR LOWER(COALESCE(gateway_ref,'')) LIKE LOWER($${i})
//           OR LOWER(COALESCE(gateway_txn_id,'')) LIKE LOWER($${i})
//           OR LOWER(COALESCE(payment_method,'')) LIKE LOWER($${i})
//           OR LOWER(COALESCE(gateway_provider,'')) LIKE LOWER($${i})
//         )
//       `.trim());
//       params.push(`%${q}%`);
//       i++;
//     }

//     const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

//     const sql = `
//       SELECT
//         to_char(date_trunc($1, payment_date::timestamp), 'YYYY-MM-DD') AS period_start,
//         COUNT(*)::int AS total_txn,
//         COALESCE(SUM(amount), 0)::numeric(12,2) AS total_amount,
//         COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_txn,
//         COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0)::numeric(12,2) AS pending_amount,
//         COUNT(*) FILTER (WHERE status <> 'PENDING')::int AS non_pending_txn,
//         COALESCE(SUM(amount) FILTER (WHERE status <> 'PENDING'), 0)::numeric(12,2) AS non_pending_amount
//       FROM ${TABLE}
//       ${whereSql}
//       GROUP BY 1
//       ORDER BY 1 DESC
//     `;

//     const rows = await runQuery(db, sql, [period, ...params]);

//     const wb = new ExcelJS.Workbook();
//     const ws = wb.addWorksheet("Total Payment");

//     ws.columns = [
//       { header: "Period Start", key: "period_start", width: 16 },
//       { header: "Total Txn", key: "total_txn", width: 10 },
//       { header: "Total Amount", key: "total_amount", width: 14 },
//       { header: "Pending Txn", key: "pending_txn", width: 12 },
//       { header: "Pending Amount", key: "pending_amount", width: 14 },
//       { header: "Non-Pending Txn", key: "non_pending_txn", width: 16 },
//       { header: "Non-Pending Amount", key: "non_pending_amount", width: 18 },
//     ];

//     (rows || []).forEach((r) => {
//       ws.addRow({
//         ...r,
//         total_amount: Number(r.total_amount ?? 0),
//         pending_amount: Number(r.pending_amount ?? 0),
//         non_pending_amount: Number(r.non_pending_amount ?? 0),
//       });
//     });

//     ws.getRow(1).font = { bold: true };
//     ws.views = [{ state: "frozen", ySplit: 1 }];

//     const fileName = `total-payment-${period}.xlsx`;
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

//     await wb.xlsx.write(res);
//     res.end();
//   } catch (err) {
//     console.error("❌ exportTotalPaymentExcel error:", err);
//     return res.status(500).json({ message: "Failed to export excel", error: err.message });
//   }
// };
