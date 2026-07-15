// controllers/billingController.js
const { getConnection, runQuery } = require('../db/connectionManager');

// GET /api/billing/list
exports.getBilling = async (req, res, next) => {
  try {
    const { fields } = req.body || {};
    let fieldList;

    if (Array.isArray(fields) && fields.length > 0) {
      
      fieldList = fields
        .map((f) => f.replace(/[^a-zA-Z0-9_\. ]/g, ''))
        .join(', ');
    }
   
    const defaultQuery = `
      SELECT ROW_NUMBER() OVER (ORDER BY id) AS number_list, *
      FROM mt_payment_plan
      WHERE is_show = true
      ORDER BY id
    `;
    const queryWithCond = `
      SELECT ROW_NUMBER() OVER (ORDER BY id) AS number_list, id, ${fieldList}
      FROM mt_payment_plan
      WHERE is_show = true
      ORDER BY id
    `;

    try {
      const db = getConnection(process.env.DB_TYPE);
      const query = fieldList ? queryWithCond : defaultQuery;
      const rows = await runQuery(db, query);
      return res.json(rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to retrieve results' });
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/billing/:id
exports.getBillingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    const result = await runQuery(
      db,
      'SELECT * FROM mt_payment_plan WHERE id = $1 AND is_show = true',
      [id]
    );
    const rows = Array.isArray(result) ? result : result?.rows;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Billing record not found' });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// POST /api/billing   (this is what the "Add Bill" form calls)
exports.createBilling = async (req, res, next) => {
  try {
    const {
      fullname,
      plan_code,
      amount_rm,
      currency = 'MYR',
      payment_method = null,
      status = 'Unpaid',
      email = null,
      phone = null,
    } = req.body || {};

    if (!fullname || !plan_code || amount_rm === undefined || amount_rm === null || amount_rm === '') {
      return res
        .status(400)
        .json({ success: false, message: 'fullname, plan_code and amount_rm are required.' });
    }

    const db = getConnection(process.env.DB_TYPE);
    const today = new Date().toISOString().slice(0, 10);
    const referenceNo = `REF-${Date.now()}`; 

    const insertQuery = `
      WITH inserted AS (
        INSERT INTO mt_payment_plan
          (reference_no, plan_code, amount_rm, currency, payment_method,
           status, fullname, email, phone, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      )
      UPDATE mt_payment_plan
      SET invoice_no = 'INV' || lpad(inserted.id::text, 7, '0')
      FROM inserted
      WHERE mt_payment_plan.id = inserted.id
      RETURNING mt_payment_plan.*;
    `;
    const params = [
      referenceNo,
      plan_code,
      String(amount_rm),
      currency,
      payment_method,
      status,
      fullname,
      email,
      phone,
      today,
      today,
    ];

    const result = await runQuery(db, insertQuery, params);
    const row = Array.isArray(result) ? result[0] : result?.rows?.[0];
    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to create billing record' });
  }
};

// PUT /api/billing/:id
exports.updateBilling = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const allowedFields = ['fullname', 'plan_code', 'amount_rm', 'payment_method', 'status', 'email', 'phone'];
    const setClauses = [];
    const params = [];
    let i = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${i}`);
        params.push(String(updates[field]));
        i++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    setClauses.push(`updated_at = $${i}`);
    params.push(new Date().toISOString().slice(0, 10));
    i++;

    params.push(id);
    const query = `UPDATE mt_payment_plan SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`;

    const db = getConnection(process.env.DB_TYPE);
    const result = await runQuery(db, query, params);
    const rows = Array.isArray(result) ? result : result?.rows;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Billing record not found' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update billing record' });
  }
};

// DELETE /api/billing/:id 
exports.deleteBilling = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    const result = await runQuery(
      db,
      `UPDATE mt_payment_plan
       SET is_show = false, updated_at = CURRENT_DATE
       WHERE id = $1 AND is_show = true
       RETURNING id`,
      [id]
    );
    const rows = Array.isArray(result) ? result : result?.rows;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Billing record not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete billing record' });
  }
};

// PATCH /api/billing/:id/restore
exports.restoreBilling = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    const result = await runQuery(
      db,
      `UPDATE mt_payment_plan
       SET is_show = true, updated_at = CURRENT_DATE
       WHERE id = $1 AND is_show = false
       RETURNING id`,
      [id]
    );
    const rows = Array.isArray(result) ? result : result?.rows;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Billing record not found or not deleted' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to restore billing record' });
  }
};