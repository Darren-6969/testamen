const { getConnection, runQuery } = require('../db/connectionManager');

// Encode/decode cursor as opaque base64 so the client just passes it back
function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}
function decodeCursor(str) {
  try { return JSON.parse(Buffer.from(str, 'base64url').toString('utf8')); }
  catch { return null; }
}

function formatDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  d.setHours(d.getHours() + 8);
  return d.toISOString().slice(0, 10);
}

// ============================================================================
//                       Get All Invoices  (cursor-based pagination)
// ============================================================================
exports.getAllInvoices = async (req, res) => {
  try {
    const db  = getConnection(process.env.DB_TYPE);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    const docnoSearch       = req.query.docno       || '';
    const companynameSearch = req.query.companyname || '';
    const attentionSearch   = req.query.attention   || '';

    const params = [limit + 1, docnoSearch, companynameSearch, attentionSearch];
    // $1=limit, $2=docno, $3=companyname, $4=attention
    let cursorClause = '';

    if (cursor?.docdate && cursor?.dockey != null) {
      params.push(cursor.docdate, cursor.dockey);
      const p1 = params.length - 1;
      const p2 = params.length;
      cursorClause = `AND (iv.docdate < $${p1} OR (iv.docdate = $${p1} AND iv.dockey < $${p2}))`;
    }

    const rows = await runQuery(db, `
      SELECT
        iv.dockey,
        iv.docno,
        iv.code,
        iv.docdate,
        iv.localdocamt,
        iv.paymentamt,
        iv.cancelled,
        c.companyname,
        cb.attention
      FROM billing_fb.ar_iv iv
      LEFT JOIN billing_fb.ar_customer c ON c.code = iv.code
      LEFT JOIN (
        SELECT DISTINCT ON (code) code, attention
        FROM billing_fb.ar_customerbranch
        ORDER BY code, dtlkey
      ) cb ON cb.code = iv.code
      WHERE 1=1
        AND ($2 = '' OR iv.docno ILIKE '%' || $2 || '%')
        AND ($3 = '' OR c.companyname ILIKE '%' || $3 || '%')
        AND ($4 = '' OR cb.attention ILIKE '%' || $4 || '%')
        ${cursorClause}
      ORDER BY iv.docdate DESC, iv.dockey DESC
      LIMIT $1
    `, params);

    const hasMore = rows.length > limit;
    const data    = hasMore ? rows.slice(0, limit) : rows;
    const last    = data[data.length - 1];

    res.json({
      data: data.map((row, idx) => ({
        rowNum:       idx + 1,
        DOCKEY:       row.dockey,
        DOCNO:        row.docno,
        CODE:         row.code,
        DOCDATE:      row.docdate,
        LOCALDOCAMT:  `RM${(+row.localdocamt || 0).toFixed(2)}`,
        COMPANYNAME:  row.companyname ?? '',
        ATTENTION:    row.attention ?? '',
        CANCELLED:    row.cancelled ? 'Cancelled' : 'Active',
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
    res.status(500).json({ error: err.message });
  }
};

// ============================================================================
//                       Get Invoice by Doc No  (no pagination — single record)
// ============================================================================
exports.getInvoiceByCode = async (req, res) => {
  try {
    const { docno } = req.params;
    const db = getConnection(process.env.DB_TYPE);

    const [headerRows, lineRows] = await Promise.all([
      runQuery(db, `
        SELECT
          iv.dockey,
          iv.docno,
          iv.code,
          iv.docdate,
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
        WHERE iv.docno = $1
        LIMIT 1
      `, [docno]),

      runQuery(db, `
        SELECT taxamt
        FROM billing_fb.ar_ivdtl
        WHERE dockey = (
          SELECT dockey FROM billing_fb.ar_iv WHERE docno = $1 LIMIT 1
        )
      `, [docno]),
    ]);

    if (headerRows.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    const header   = headerRows[0];
    const taxTotal = lineRows.reduce((s, l) => s + (+l.taxamt || 0), 0);

    res.json({
      DOCNO:          header.docno,
      DOCKEY:         header.dockey,
      InvoiceDate:    formatDate(header.docdate),
      TotalAmount:    header.localdocamt,
      CurrentBalance: (+header.localdocamt || 0) - (+header.paymentamt || 0),
      CompanyName:    header.companyname ?? null,
      ContactPerson:  header.attention ?? null,
      TaxTotalAmount: taxTotal,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================================
//                       Get Open Invoices by Customer  (cursor-based pagination)
// ============================================================================
exports.getOpenInvoicesByCustomer = async (req, res) => {
  try {
    const { code } = req.params;
    const db    = getConnection(process.env.DB_TYPE);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    const params = [code, limit + 1];
    let cursorClause = '';

    if (cursor?.docdate && cursor?.dockey != null) {
      cursorClause = `
        AND (iv.docdate < $3 OR (iv.docdate = $3 AND iv.dockey < $4))
      `;
      params.push(cursor.docdate, cursor.dockey);
    }

    // Fetch invoices with remaining balance, using the cursor for pagination
    const invoiceRows = await runQuery(db, `
      SELECT
        iv.dockey,
        iv.docno,
        iv.docdate,
        iv.localdocamt,
        COALESCE(SUM(k.localkoamt), 0) AS total_knockoff
      FROM billing_fb.ar_iv iv
      LEFT JOIN billing_fb.ar_knockoff k
        ON k.todockey = iv.dockey
        AND k.todoctype = 'IV'
        AND k.fromdoctype IN ('PM', 'CN')
      WHERE iv.code = $1
        ${cursorClause}
      GROUP BY iv.dockey, iv.docno, iv.docdate, iv.localdocamt
      HAVING iv.localdocamt - COALESCE(SUM(k.localkoamt), 0) > 0
      ORDER BY iv.docdate DESC, iv.dockey DESC
      LIMIT $2
    `, params);

    const hasMore = invoiceRows.length > limit;
    const page    = hasMore ? invoiceRows.slice(0, limit) : invoiceRows;

    if (page.length === 0) {
      return res.json({
        data: [],
        pagination: { limit, hasMore: false, nextCursor: null },
      });
    }

    // Fetch knockoff details for this page only
    const dockeys = page.map(r => r.dockey);
    const knockoffRows = await runQuery(db, `
      SELECT
        k.todockey,
        k.fromdoctype,
        k.fromdockey,
        k.localkoamt,
        k.koamt,
        k.kotaxdate,
        COALESCE(pm.docno,        cn.docno)        AS source_docno,
        COALESCE(pm.docdate,      cn.docdate)      AS source_docdate,
        COALESCE(pm.description,  cn.description)  AS source_description,
        COALESCE(pm.localdocamt,  cn.localdocamt)  AS source_localdocamt
      FROM billing_fb.ar_knockoff k
      LEFT JOIN billing_fb.ar_pm pm
        ON pm.dockey = k.fromdockey AND k.fromdoctype = 'PM'
      LEFT JOIN billing_fb.ar_cn cn
        ON cn.dockey = k.fromdockey AND k.fromdoctype = 'CN'
      WHERE k.todoctype = 'IV'
        AND k.fromdoctype IN ('PM', 'CN')
        AND k.todockey = ANY($1::int[])
    `, [dockeys]);

    const knockoffMap = {};
    for (const k of knockoffRows) {
      (knockoffMap[k.todockey] ||= []).push(k);
    }

    const last = page[page.length - 1];

    res.json({
      data: page.map(inv => {
        const invoiceAmount = +inv.localdocamt || 0;
        const totalKnockoff = +inv.total_knockoff || 0;
        const availableAmount = Math.max(Number((invoiceAmount - totalKnockoff).toFixed(2)), 0);

        return {
          docno:              inv.docno,
          dockey:             inv.dockey,
          docdate:            inv.docdate,
          amount:             invoiceAmount,
          TotalKnockoffAmount: Number(totalKnockoff.toFixed(2)),
          AvailableAmount:    availableAmount,
          status:             totalKnockoff === 0 ? 'OPEN' : 'PARTIAL',
          KnockoffList:       (knockoffMap[inv.dockey] || []).map(k => ({
            KnockoffAmount:       +k.localkoamt || 0,
            KnockoffDate:         k.kotaxdate,
            SourceDocType:        k.fromdoctype,
            SourceDocKey:         k.fromdockey,
            SourceDocNo:          k.source_docno ?? null,
            SourceDocDate:        k.source_docdate ?? null,
            SourceDocDescription: k.source_description ?? null,
            SourceDocAmount:      k.source_localdocamt ?? null,
          })),
        };
      }),
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore
          ? encodeCursor({ docdate: last.docdate, dockey: last.dockey })
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
