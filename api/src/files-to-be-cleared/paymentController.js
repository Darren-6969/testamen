const { getConnection, runQuery } = require('../db/connectionManager');

function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}
function decodeCursor(str) {
  try { return JSON.parse(Buffer.from(str, 'base64url').toString('utf8')); }
  catch { return null; }
}

// ============================================================================
//                       Get All Payments  (cursor-based pagination)
//
// Two separate sources with different sort keys:
//   - Pending   →  sorted by created_at DESC, id  (public schema)
//   - Completed →  sorted by docdate DESC, dockey  (billing_fb schema)
//
// The client receives two independent nextCursor values and passes
// whichever one it wants to advance:
//   ?pending_cursor=...   advance the pending page
//   ?completed_cursor=... advance the completed page
// ============================================================================
exports.listAllPayments = async (req, res) => {
  try {
    const db    = getConnection(process.env.DB_TYPE);
    const limit = Math.min(parseInt(req.query.limit) || 10, 200);

    const pendingCursor   = req.query.pending_cursor   ? decodeCursor(req.query.pending_cursor)   : null;
    const completedCursor = req.query.completed_cursor ? decodeCursor(req.query.completed_cursor) : null;

    // ── Pending payments ──────────────────────────────────────────────────
    const docnoSearch         = req.query.docno || '';
    const customerNameSearch  = req.query.customer_name || '';
    const customerCodeSearch  = req.query.customer_code || '';
    const billReferenceSearch = req.query.bill_reference || '';
    const docdateSearch       = req.query.docdate || '';
    const amountSearch        = req.query.amount || '';
    const statusSearch        = req.query.status || '';

    const pendingParams = [limit + 1, docnoSearch, customerNameSearch, customerCodeSearch, billReferenceSearch, docdateSearch, amountSearch, statusSearch];
    let pendingCursorClause = '';

    if (pendingCursor?.created_at && pendingCursor?.id != null) {
      pendingParams.push(pendingCursor.created_at, pendingCursor.id);
      const p1 = pendingParams.length - 1;
      const p2 = pendingParams.length;
      pendingCursorClause = `AND (pp.created_at < $${p1} OR (pp.created_at = $${p1} AND pp.id < $${p2}))`;
    }
	
    const pendingRows = await runQuery(db, `
      SELECT
        pp.id AS dockey,
        pp.reference_no AS docno,
        pp.payment_date AS docdate,
        pp.amount,
        pp.reference_no,
        pp.customer_code,
        pp.status,
        u.name AS customer_name,
        STRING_AGG(pi.invoice_docno, ', ' ORDER BY pi.invoice_docno) AS bill_reference,
        pp.created_at
      FROM payment_pending pp
      JOIN customer c ON c.customer_code = pp.customer_code
      JOIN users u ON u.id = c.user_id
      LEFT JOIN payment_items pi
        ON pi.payment_id = pp.id AND pi.deleted_at IS NULL
      WHERE pp.status != 'COMPLETED'
        AND pp.deleted_at IS NULL
        AND ($2 = '' OR pp.reference_no ILIKE '%' || $2 || '%')
        AND ($3 = '' OR u.name ILIKE '%' || $3 || '%')
        AND ($4 = '' OR pp.customer_code ILIKE '%' || $4 || '%')
        AND ($6 = '' OR pp.payment_date::text ILIKE '%' || $6 || '%')
        AND ($7 = '' OR pp.amount::text ILIKE '%' || $7 || '%')
        AND ($8 = '' OR pp.status ILIKE '%' || $8 || '%')
        ${pendingCursorClause}
      GROUP BY pp.id, pp.payment_date, pp.amount, pp.reference_no,
               pp.customer_code, pp.status, u.name, pp.created_at
      HAVING ($5 = '' OR COALESCE(STRING_AGG(pi.invoice_docno, ', ' ORDER BY pi.invoice_docno), '') ILIKE '%' || $5 || '%')
      ORDER BY pp.created_at DESC, pp.id DESC
      LIMIT $1
    `, pendingParams);

    const pendingHasMore = pendingRows.length > limit;
    const pendingData    = pendingHasMore ? pendingRows.slice(0, limit) : pendingRows;
    const pendingLast    = pendingData[pendingData.length - 1];

    // ── Completed payments (billing_fb) ───────────────────────────────────
    const completedParams = [limit + 1, docnoSearch, customerCodeSearch, customerNameSearch, billReferenceSearch, docdateSearch, amountSearch, statusSearch];
    let completedCursorClause = '';

    if (completedCursor?.docdate && completedCursor?.dockey != null) {
      completedParams.push(completedCursor.docdate, completedCursor.dockey);
      const p1 = completedParams.length - 1;
      const p2 = completedParams.length;
      completedCursorClause = `AND (pm.docdate < $${p1} OR (pm.docdate = $${p1} AND pm.dockey < $${p2}))`;
    }

    const completedRows = await runQuery(db, `
      SELECT
        pm.dockey,
        pm.docno,
        pm.docdate,
        pm.code        AS customer_code,
        c.companyname  AS customer_name,
        pm.localdocamt AS amount,
        STRING_AGG(iv.docno, ', ' ORDER BY iv.docno) AS bill_reference,
        'COMPLETED'    AS status,
        'POSTGRES'     AS source
      FROM billing_fb.ar_pm pm
      LEFT JOIN billing_fb.ar_customer c ON c.code = pm.code
      LEFT JOIN billing_fb.ar_knockoff k
        ON k.fromdockey = pm.dockey
        AND k.fromdoctype = 'PM'
        AND k.todoctype = 'IV'
      LEFT JOIN billing_fb.ar_iv iv ON iv.dockey = k.todockey
      WHERE pm.cancelled IS NOT TRUE
        AND ($2 = '' OR pm.docno ILIKE '%' || $2 || '%')
        AND ($3 = '' OR pm.code ILIKE '%' || $3 || '%')
        AND ($4 = '' OR c.companyname ILIKE '%' || $4 || '%')
        AND ($6 = '' OR pm.docdate::text ILIKE '%' || $6 || '%')
        AND ($7 = '' OR pm.localdocamt::text ILIKE '%' || $7 || '%')
        AND ($8 = '' OR 'COMPLETED' ILIKE '%' || $8 || '%')
        ${completedCursorClause}
      GROUP BY pm.dockey, pm.docno, pm.docdate, pm.code, c.companyname, pm.localdocamt
      HAVING ($5 = '' OR COALESCE(STRING_AGG(iv.docno, ', ' ORDER BY iv.docno), '') ILIKE '%' || $5 || '%')
      ORDER BY pm.docdate DESC, pm.dockey DESC
      LIMIT $1
    `, completedParams);

    const completedHasMore = completedRows.length > limit;
    const completedData    = completedHasMore ? completedRows.slice(0, limit) : completedRows;
    const completedLast    = completedData[completedData.length - 1];

    res.json({
      pending: {
        data: pendingData.map(p => ({
          ...p,
          docno: p.reference_no,
          source: 'POSTGRES',
        })),
        pagination: {
          limit,
          hasMore: pendingHasMore,
          nextCursor: pendingHasMore
            ? encodeCursor({ created_at: pendingLast.created_at, id: pendingLast.dockey })
            : null,
        },
      },
      completed: {
        data: completedData.map(p => ({
          ...p,
          amount: (+p.amount || 0).toFixed(2),
        })),
        pagination: {
          limit,
          hasMore: completedHasMore,
          nextCursor: completedHasMore
            ? encodeCursor({ docdate: completedLast.docdate, dockey: completedLast.dockey })
            : null,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching all payments:', err);
    res.status(500).json({ message: 'Failed to fetch all payments' });
  }
};


// ============================================================================
//                       Get Pending Payments  (cursor-based pagination)
// ============================================================================
exports.listPendingPayments = async (req, res) => {
  try {
    const db     = getConnection(process.env.DB_TYPE);
    const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
    const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    const referenceNoSearch  = req.query.reference_no || '';
    const customerCodeSearch = req.query.customer_code || '';
    const customerNameSearch = req.query.customer_name || '';
    const billReferenceSearch = req.query.bill_reference || '';
    const docdateSearch      = req.query.docdate || '';
    const amountSearch       = req.query.amount || '';
    const statusSearch       = req.query.status || '';

    const params = [limit + 1, referenceNoSearch, customerCodeSearch, customerNameSearch, billReferenceSearch, docdateSearch, amountSearch, statusSearch];
    let cursorClause = '';

    if (cursor?.created_at && cursor?.id != null) {
      cursorClause = `
        AND (pp.created_at < $9 OR (pp.created_at = $9 AND pp.id < $10))
      `;
      params.push(cursor.created_at, cursor.id);
    }

		const rows = await runQuery(db, `
			SELECT
				pp.id           AS dockey,
				pp.payment_date AS docdate,
				pp.amount,
				pp.reference_no,
				pp.customer_code,
				pp.status,
				u.name          AS customer_name,
				STRING_AGG(pi.invoice_docno, ', ' ORDER BY pi.invoice_docno) AS bill_reference,
				pp.created_at
			FROM payment_pending pp
			JOIN customer c ON c.customer_code = pp.customer_code
			JOIN users u ON u.id = c.user_id
			LEFT JOIN payment_items pi
				ON pi.payment_id = pp.id AND pi.deleted_at IS NULL
      WHERE pp.status != 'COMPLETED'
        AND pp.deleted_at IS NULL
        AND ($2 = '' OR pp.reference_no ILIKE '%' || $2 || '%')
        AND ($3 = '' OR pp.customer_code ILIKE '%' || $3 || '%')
        AND ($4 = '' OR u.name ILIKE '%' || $4 || '%')
        AND ($6 = '' OR pp.payment_date::text ILIKE '%' || $6 || '%')
        AND ($7 = '' OR pp.amount::text ILIKE '%' || $7 || '%')
        AND ($8 = '' OR pp.status ILIKE '%' || $8 || '%')
        ${cursorClause}
      GROUP BY pp.id, pp.payment_date, pp.amount, pp.reference_no,
               pp.customer_code, pp.status, u.name, pp.created_at
      HAVING ($5 = '' OR COALESCE(STRING_AGG(pi.invoice_docno, ', ' ORDER BY pi.invoice_docno), '') ILIKE '%' || $5 || '%')
      ORDER BY pp.created_at DESC, pp.id DESC
      LIMIT $1
    `, params);

		const hasMore = rows.length > limit;
		const data    = hasMore ? rows.slice(0, limit) : rows;
		const last    = data[data.length - 1];

		res.json({
      data: data.map((r, idx) => ({ rowNum: idx + 1, ...r, docno: r.reference_no, source: 'POSTGRES' })),
			pagination: {
				limit,
				hasMore,
				nextCursor: hasMore
				? encodeCursor({ created_at: last.created_at, id: last.dockey })
				: null,
			},
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Failed to retrieve pending payments' });
	}
};


// ============================================================================
//                       Get Completed Payments  (cursor-based pagination)
// ============================================================================
exports.listCompletedPayments = async (req, res) => {
  try {
    const db     = getConnection(process.env.DB_TYPE);
    const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
    const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    const docnoSearch        = req.query.docno          || '';
    const customerCodeSearch = req.query.customer_code  || '';
    const customerNameSearch = req.query.customer_name  || '';
    const billReferenceSearch = req.query.bill_reference || '';
    const docdateSearch      = req.query.docdate        || '';
    const amountSearch       = req.query.amount         || '';

    const params = [limit + 1, docnoSearch, customerCodeSearch, customerNameSearch, billReferenceSearch, docdateSearch, amountSearch];
    let cursorClause = '';

    if (cursor?.docdate && cursor?.dockey != null) {
      params.push(cursor.docdate, cursor.dockey);
      const p1 = params.length - 1;
      const p2 = params.length;
      cursorClause = `AND (pm.docdate < $${p1} OR (pm.docdate = $${p1} AND pm.dockey < $${p2}))`;
    }

    const rows = await runQuery(db, `
      SELECT
        pm.dockey,
        pm.docno,
        pm.code        AS customer_code,
        c.companyname  AS customer_name,
        pm.docdate,
        pm.localdocamt AS amount,
        pm.cancelled,
        STRING_AGG(iv.docno, ', ' ORDER BY iv.docno) AS bill_reference,
        'COMPLETED'    AS status,
        'POSTGRES'     AS source
      FROM billing_fb.ar_pm pm
      LEFT JOIN billing_fb.ar_customer c ON c.code = pm.code
      LEFT JOIN billing_fb.ar_knockoff k
        ON k.fromdockey = pm.dockey
        AND k.fromdoctype = 'PM'
        AND k.todoctype = 'IV'
      LEFT JOIN billing_fb.ar_iv iv ON iv.dockey = k.todockey
      WHERE pm.cancelled IS NOT TRUE
        AND ($2 = '' OR pm.docno ILIKE '%' || $2 || '%')
        AND ($3 = '' OR pm.code ILIKE '%' || $3 || '%')
        AND ($4 = '' OR c.companyname ILIKE '%' || $4 || '%')
        AND ($6 = '' OR pm.docdate::text ILIKE '%' || $6 || '%')
        AND ($7 = '' OR pm.localdocamt::text ILIKE '%' || $7 || '%')
        ${cursorClause}
      GROUP BY pm.dockey, pm.docno, pm.code, c.companyname,
               pm.docdate, pm.localdocamt, pm.cancelled
      HAVING ($5 = '' OR COALESCE(STRING_AGG(iv.docno, ', ' ORDER BY iv.docno), '') ILIKE '%' || $5 || '%')
      ORDER BY pm.docdate DESC, pm.dockey DESC
      LIMIT $1
    `, params);

    const hasMore = rows.length > limit;
    const data    = hasMore ? rows.slice(0, limit) : rows;
    const last    = data[data.length - 1];

    res.json({
      data: data.map((r, idx) => ({
        rowNum: idx + 1,
        ...r,
        amount: (+r.amount || 0).toFixed(2),
      })),
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore
          ? encodeCursor({ docdate: last.docdate, dockey: last.dockey })
          : null,
      },
    });
  } catch (err) {
    console.error('Error fetching completed payments:', err);
    res.status(500).json({ message: 'Failed to fetch completed payments' });
  }
};

// ============================================================================
//                       Create Payment
// ============================================================================
exports.createPayment = async (req, res, next) => {
	const db = getConnection(process.env.DB_TYPE);
	try {

		const {
			customer_code,
			docdate,
			payment_method,
			reference_no,
			amount,
			payment_source,
			status,
			invoices
		} = req.body;

		if (!invoices || invoices.length === 0) {
			return res.status(400).json({ message: 'No invoices selected' });
		}

		await runQuery(db, 'BEGIN');

    	const [payment] = await runQuery(db, `
			INSERT INTO payment_pending
				(customer_code, payment_date, amount, payment_method, reference_no, payment_source, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id
    		`, [customer_code, docdate, amount, payment_method, reference_no, payment_source, status]);

		for (const inv of invoices) {
			await runQuery(db, `
				INSERT INTO payment_items
					(payment_id, invoice_dockey, invoice_docno, invoice_date, applied_amount)
				VALUES ($1, $2, $3, $4, $5)
			`, [payment.id, inv.InvoiceDocKey, inv.InvoiceDocNo, inv.InvoiceDocDate, inv.ApplyAmount]);
		}

		await runQuery(db, 'COMMIT');
    	return res.status(201).json({ payment_id: payment.id, message: 'Payment created successfully' });
	} catch (err) {
		await runQuery(db, 'ROLLBACK');
		next(err);
	}
};


// ============================================================================
//                       Update Pending Payment
// ============================================================================
exports.updatePayment = async (req, res, next) => {
	const db = getConnection(process.env.DB_TYPE);
	try {
		const {
			customer_name,
			customer_code,
			contact_no,
			reference_no,
			docdate,
			payment_method,
			amount,
			invoices
		} = req.body;

		const paymentId = req.params.dockey;

		if (!invoices || invoices.length === 0) {
			return res.status(400).json({ message: 'No invoices selected' });
		}

		await runQuery(db, 'BEGIN');

		const existingRows = await runQuery(db, `
		SELECT invoice_dockey, invoice_docno, applied_amount
				FROM payment_items
		WHERE payment_id = $1 AND deleted_at IS NULL
		`, [paymentId]);

		const existingMap = new Map(existingRows.map(r => [r.invoice_docno, r]));
		const incomingMap = new Map(invoices.map(i => [i.InvoiceDocNo, i]));
			
		for (const [docno] of existingMap) {
			if (!incomingMap.has(docno)) {
				await runQuery(db, `
				UPDATE payment_items SET deleted_at = NOW()
				WHERE payment_id = $1 AND invoice_docno = $2
				`, [paymentId, docno]);
			}
		}

		// add new or update existing invoices
		for (const inv of invoices) {
			if (existingMap.has(inv.InvoiceDocNo)) {
				await runQuery(db, `
				UPDATE payment_items
				SET invoice_dockey = $1, invoice_date = $2, applied_amount = $3, updated_at = NOW()
				WHERE payment_id = $4 AND invoice_docno = $5 AND deleted_at IS NULL
				`, [inv.InvoiceDocKey, inv.InvoiceDocDate, inv.ApplyAmount, paymentId, inv.InvoiceDocNo]);
			} else {
				await runQuery(db, `
				INSERT INTO payment_items (payment_id, invoice_dockey, invoice_docno, invoice_date, applied_amount)
					VALUES ($1, $2, $3, $4, $5)
				`, [paymentId, inv.InvoiceDocKey, inv.InvoiceDocNo, inv.InvoiceDocDate, inv.ApplyAmount]);
			}
		}

    	await runQuery(db, `
		UPDATE payment_pending
		SET reference_no = $1, payment_date = $2, payment_method = $3, amount = $4
		WHERE id = $5 AND status != 'COMPLETED' AND deleted_at IS NULL AND customer_code = $6
		`, [reference_no, docdate, payment_method, amount, paymentId, customer_code]);

		await runQuery(db, 'COMMIT');
    	return res.status(200).json({ payment_id: paymentId, message: 'Payment updated successfully' });
	} catch (err) {
		await runQuery(db, 'ROLLBACK');
		next(err);
	}
};

// ============================================================================
//                       Update Status Payment
// ============================================================================
exports.updateStatusPayment = async (req, res, next) => {
	const { dockey } = req.params;
	const db = getConnection(process.env.DB_TYPE);
	try {
    	const result = await runQuery(db, `
			UPDATE payment_pending
			SET status = 'COMPLETED',
				updated_at = NOW()
			WHERE id = $1
			AND deleted_at IS NULL
			RETURNING *
    	`, [dockey]);

		if (result.length === 0) {
			return res.status(404).json({ message: 'Payment not found or already deleted' });
		}
		
		return res.json({ message: 'Payment status updated successfully' });
	} catch (err) {
		next(err);
	}
};

// ============================================================================
//                       View Completed Payment  (single record — no pagination)
// ============================================================================
exports.viewCompletedPayment = async (req, res) => {
  const { dockey } = req.params;

  try {
    const db = getConnection(process.env.DB_TYPE);

    const [headerRows, invoiceRows] = await Promise.all([
      runQuery(db, `
        SELECT
          pm.dockey,
          pm.docno,
          pm.code        AS customer_code,
          c.companyname  AS customer_name,
          cb.phone1      AS contact_no,
          pm.docdate,
          pm.localdocamt AS amount,
          pm.cancelled,
          gl.description AS payment_method_desc
        FROM billing_fb.ar_pm pm
        LEFT JOIN billing_fb.ar_customer c ON c.code = pm.code
        LEFT JOIN (
          SELECT DISTINCT ON (code) code, phone1
          FROM billing_fb.ar_customerbranch
          ORDER BY code, dtlkey
        ) cb ON cb.code = pm.code
        LEFT JOIN billing_fb.gl_acc gl ON gl.code = pm.paymentmethod
        WHERE pm.dockey = $1
        LIMIT 1
      `, [dockey]),

      runQuery(db, `
        SELECT
          iv.docno  AS inv_docno,
          iv.docdate AS inv_docdate,
          k.koamt   AS amount
        FROM billing_fb.ar_knockoff k
        JOIN billing_fb.ar_iv iv ON iv.dockey = k.todockey
        WHERE k.fromdockey = $1
          AND k.fromdoctype = 'PM'
          AND k.todoctype = 'IV'
      `, [dockey]),
    ]);

    if (headerRows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const p = headerRows[0];
    res.json({
      dockey:         p.dockey,
      docno:          p.docno,
      customer_code:  p.customer_code,
      customer_name:  p.customer_name ?? null,
      contact_no:     p.contact_no ?? null,
      docdate:        p.docdate,
      amount:         (+p.amount || 0).toFixed(2),
      cancelled:      p.cancelled,
      payment_method: p.payment_method_desc ?? '-',
      reference_no:   '-',
      invoices: invoiceRows.map(r => ({
        inv_docno:   r.inv_docno ?? '',
        inv_docdate: r.inv_docdate ?? '',
        amount:      (+r.amount || 0).toFixed(2),
      })),
    });
  } catch (err) {
    console.error('Error fetching completed payment:', err);
    res.status(500).json({ message: 'Failed to fetch completed payment' });
  }
};


// ============================================================================
//                       View Pending Payment  (single record — no pagination)
// ============================================================================
exports.viewPendingPayment = async (req, res, next) => {
  try {
    const { dockey } = req.params;
    const db = getConnection(process.env.DB_TYPE);

    const headerRows = await runQuery(db, `
      SELECT
        p.id            AS "dockey",
        p.reference_no,
        p.payment_date  AS "docdate",
        p.amount,
        p.payment_method,
        p.payment_source,
        p.status,
        p.customer_code,
        u.name          AS "customer_name",
        c.contact_no
      FROM payment_pending p
      JOIN customer c ON c.customer_code = p.customer_code
      JOIN users u ON u.id = c.user_id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      LIMIT 1
    `, [dockey]);

    if (headerRows.length === 0) {
      return res.status(404).json({ message: 'Pending payment not found' });
    }

    const invoiceRows = await runQuery(db, `
      SELECT
        pi.invoice_dockey  AS "inv_dockey",
        pi.invoice_docno  AS "inv_docno",
        pi.invoice_date  AS "inv_docdate",
        pi.applied_amount AS "amount"
      FROM payment_items pi
      WHERE pi.payment_id = $1
	  AND pi.deleted_at IS NULL
      ORDER BY pi.created_at
    `, [dockey]);

    return res.json({ ...headerRows[0], invoices: invoiceRows });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// ============================================================================
//                       Delete Pending Payment
// ============================================================================
exports.deletePendingPayment = async (req, res, next) => {
	const { dockey } = req.params;
	const db = getConnection(process.env.DB_TYPE);
	try {
		await runQuery(db, 'BEGIN');

		await runQuery(db, `
			UPDATE payment_items
			SET deleted_at = NOW()
			WHERE payment_id = $1
			AND deleted_at IS NULL
			`,[dockey]);
		
		await runQuery(db,`
			UPDATE payment_pending
			SET deleted_at = NOW()
			WHERE id = $1
			AND deleted_at IS NULL
			`,[dockey]);
		await runQuery(db, 'COMMIT');
		return res.status(200).json({ message: 'Pending payment deleted successfully' });
	} catch (err) {
		await runQuery(db, 'ROLLBACK');
		console.error(err);
		next(err);
	}
};
