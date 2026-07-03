const { getConnection, runQuery } = require('../db/connectionManager');
const { loadJsonFast } = require('../utils/jsonLoader');
const { indexBy, groupBy } = require('../utils/jsonIndexes');

let MongoUser;

// ============================================================================
//                       MongoDB Model Initialization
// ============================================================================
// If Mongo is enabled, register the User model with the active Mongo connection
// so it can be queried. Otherwise, MongoUser remains undefined.
if (process.env.USE_MONGO === 'true') {
  const conn = getConnection('mongo');
  MongoUser = conn.model('User', require('../models/user').schema);
}

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

function formatDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  d.setHours(d.getHours() + 8);
  return d.toISOString().slice(0, 10); // Returns YYYY-MM-DD
}

function formatAmount(amount) {
  return `RM${(+amount || 0).toFixed(2)}`;
}

async function getCustomerCodeByUserId(db, user_id) {
  const query = `SELECT customer_code FROM customer WHERE user_id = $1`;
  const rows = await runQuery(db, query, [user_id]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0].customer_code;
}

exports.getInvoiceCustomer = async (req, res, next) => {
  try {
    const user_id = getCurrentUserId(req);
    const db = getConnection(process.env.DB_TYPE);
    const customer_code = await getCustomerCodeByUserId(db, user_id);

    if (!customer_code) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const invoices = await runQuery(db, `
      SELECT
        iv.dockey,
        iv.docno,
        iv.docdate,
        iv.code,
        iv.localdocamt,
        iv.paymentamt,
        c.companyname,
        cb.attention
      FROM billing_fb.ar_iv iv
      LEFT JOIN billing_fb.ar_customer c ON c.code = iv.code
      LEFT JOIN (
        SELECT DISTINCT ON (code) code, attention
        FROM billing_fb.ar_customerbranch
        ORDER BY code, dtlkey
      ) cb ON cb.code = iv.code
      WHERE iv.code = $1
      AND iv.docdate >= (CURRENT_DATE - INTERVAL '1 year')
      ORDER BY iv.docdate DESC, iv.dockey DESC
    `, [customer_code]);

    const result = invoices.map((inv, idx) => ({
      rowNum: idx + 1,
      DOCNO: inv.docno,
      DOCKEY: inv.dockey,
      CODE: inv.code,
      DOCDATE: formatDate(inv.docdate),   // ✅ apply function here
      LOCALDOCAMT: `RM${(+inv.localdocamt || 0).toFixed(2)}`,
      CURRENTBALANCE: (+inv.localdocamt || 0) - (+inv.paymentamt || 0),
      COMPANYNAME: inv.companyname ?? '',
      ATTENTION: inv.attention ?? '',
      CANCELLED: inv.cancelled ? 'Cancelled' : 'Active',
    }));

    res.json(result);

  } catch (err) {
    console.error('Error fetching invoices:', err);
    return res.status(500).json({
      message: 'Failed to fetch invoices',
      error: err.message
    });
  }
};

exports.getYearlyInvoiceSummary = async (req, res, next) => {
  try {
    const user_id = getCurrentUserId(req);
    const db = getConnection(process.env.DB_TYPE);
    const currentYear = new Date().getFullYear();
    const customer_code = await getCustomerCodeByUserId(db, user_id);

    if (!customer_code) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const maxYear = currentYear - 1;
    const minYear = currentYear - 4;

    const summary = await runQuery(
      db,
      `SELECT
        EXTRACT(YEAR FROM iv.docdate)::int AS year,
        COALESCE(MAX(c.companyname), '') AS companyname,
        COALESCE(SUM(iv.localdocamt), 0) AS total_amount
      FROM billing_fb.ar_iv iv
      LEFT JOIN billing_fb.ar_customer c ON c.code = iv.code
      WHERE iv.code = $1
        AND EXTRACT(YEAR FROM iv.docdate) BETWEEN $2 AND $3
      GROUP BY EXTRACT(YEAR FROM iv.docdate)
      ORDER BY year DESC
    `,
      [customer_code, minYear, maxYear]
    );

    const result = Array.from({ length: 4 }, (_, index) => maxYear - index).map((year, idx) => {
      const matched = summary.find((item) => Number(item.year) === year);

      return {
        rowNum: idx + 1,
        year,
        companyname: matched?.companyname ?? '',
        totalamount: formatAmount(matched?.total_amount),
      };
    });

    return res.json(result);

  } catch (err) {
    console.error('Error fetching yearly invoice summary:', err);
    return res.status(500).json({ message: 'Failed to fetch yearly invoice summary', error: err.message });
  }
};

exports.getInvoicesByYear = async (req, res, next) => {
  try {
    const user_id = getCurrentUserId(req);
    const db = getConnection(process.env.DB_TYPE);
    const year = Number.parseInt(req.params.year, 10);

    if (!Number.isInteger(year)) {
      return res.status(400).json({ message: 'Invalid year supplied' });
    }

    const customer_code = await getCustomerCodeByUserId(db, user_id);

    if (!customer_code) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const invoices = await runQuery(
      db,
      `
        SELECT
          iv.dockey,
          iv.docdate,
          iv.docno,
          iv.localdocamt
        FROM billing_fb.ar_iv iv
        WHERE iv.code = $1
          AND EXTRACT(YEAR FROM iv.docdate) = $2
        ORDER BY iv.docdate DESC, iv.dockey DESC
        LIMIT 12
      `,
      [customer_code, year]
    );

    const result = invoices.map((inv, idx) => ({
      rowNum: idx + 1,
      year,
      DOCKEY: inv.dockey,
      DOCDATE: formatDate(inv.docdate),
      DOCNO: inv.docno,
      LOCALDOCAMT: formatAmount(inv.localdocamt),
    }));

    return res.json(result);
  } catch (err) {
    console.error('Error fetching invoices by year:', err);
    return res.status(500).json({
      message: 'Failed to fetch invoices by year',
      error: err.message,
    });
  }
};
