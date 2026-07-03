const { getConnection, runQuery } = require('../db/connectionManager');
const fs = require('fs-extra');
const path = require('path');
// const EXPORT_DIR = 'C:/Users/Afiq/Desktop/firebird_exports';
const EXPORT_DIR = 'C:/Users/USER/Documents/firebird_exports';
const { loadJsonFast } = require('../utils/jsonLoader');

// format date
function formatDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  d.setHours(d.getHours() + 8);
  return d.toISOString().slice(0, 10); // Returns YYYY-MM-DD
}

// load json
function loadJson(fileName) {
  const filePath = path.join(EXPORT_DIR, fileName);
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// ============================================================================
//                       Get All Invoice
// ============================================================================
exports.getAllInvoices = async (req, res, next) => {
  try {
    // Extract requested fields
    const { fields } = req.body || {};
    const db = getConnection('firebird');

    if (!db) {
      return res.status(500).json({ error: 'Firebird connection not configured.' });
    }

    let fieldList;

    if (Array.isArray(fields) && fields.length > 0) {
      // Prevent SQL injection by sanitizing column names:
      // - allow letters, numbers, underscore, dot, and space (for aliases)
      fieldList = fields
        .map(f => f.replace(/[^a-zA-Z0-9_\. ]/g, ''))
        .join(', ');
    }

    // Default query (all columns + join with user_role)
    const defaultQuery = `SELECT
                            t1.DOCDATE,
                            t1.DOCNO,
                            t2.COMPANYNAME,
                            t1.LOCALDOCAMT,
                            t3.ATTENTION,
                            t1.CANCELLED
                          FROM AR_IV t1 
                          JOIN AR_CUSTOMER t2 ON t2.CODE = t1.CODE
                          JOIN AR_CUSTOMERBRANCH t3 ON t3.CODE = t1.CODE
                          ORDER BY t1.DOCDATE DESC`;

    // Query with selected fields if provided
    const queryWithCond = `SELECT ${fieldList} 
                          FROM AR_IV t1 
                          JOIN AR_CUSTOMER t2 ON t2.CODE = t1.CODE
                          JOIN AR_CUSTOMERBRANCH t3 ON t3.CODE = t1.CODE
                          ORDER BY t1.DOCDATE DESC`;

    // ------------------------------------------------------------------------
    // Run Query
    // ------------------------------------------------------------------------
    try {
      const fb = await db.getConnection();
      const query = fieldList ? queryWithCond : defaultQuery;
      const rows = await new Promise((resolve, reject) => {
        fb.query(query, [], (err, result) => {
          fb.detach(); // Always release connection
          if (err) return reject(err);

          // Format the result here
          const formatted = result.map((row, idx) => ({
            ...row,
            DOCDATE: row.DOCDATE
              ? dayjs(row.DOCDATE).add(8, 'hour').format('YYYY-MM-DD')  // Adjust timezone and format
              : null,
            LOCALDOCAMT: row.LOCALDOCAMT
              ? 'RM' + parseFloat(row.LOCALDOCAMT).toFixed(2)
              : 'RM0.00',
            CANCELLED: row.CANCELLED == false ? 'Active' : 'Cancelled',
            rowNum: idx + 1,
          }));

          resolve(formatted); // Resolve with formatted data, not the raw result
        });
      });

      // Send the response with formatted data
      return res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve results' });
    }


    // ------------------------------------------------------------------------
    // No Database Configured
    // ------------------------------------------------------------------------
    return res.status(500).json({ error: 'No database configured.' });
  } catch (err) {
    next(err);
  }
};

exports.getAllInvoices2 = async (req, res, next) => {
  try {
    console.log('Fetching invoices...');
    const invoices = await fs.readJson(path.join(EXPORT_DIR, "ar_iv.json"));
    const customers = await fs.readJson(path.join(EXPORT_DIR, "ar_customer.json"));
    const branches = await fs.readJson(path.join(EXPORT_DIR, "ar_customerbranch.json"));
    
    const customerMap = Object.fromEntries(customers.map(c => [c.CODE, c]));
    const branchMap = Object.fromEntries(branches.map(b => [b.CODE, b]));

    let mergedData = invoices.map(inv => {
      const cust = customerMap[inv.CODE] || {};
      const branch = branchMap[inv.CODE] || {};

      return {
        ...inv,
        COMPANYNAME: cust.COMPANYNAME || '',
        ATTENTION: branch.ATTENTION || '',
        LOCALDOCAMT:
          Number(inv.LOCALDOCAMT)
          ? "RM" + Number(inv.LOCALDOCAMT).toFixed(2)
          : "RM0.00",
        DOCDATE: inv.DOCDATE ? formatDate(inv.DOCDATE) : null,
        CANCELLED: inv.CANCELLED === false ? 'Active' : 'Cancelled',
      };
    });

    // Sort by DOCDATE descending
    mergedData.sort((a, b) => {
      if (!a.DOCDATE) return 1;
      if (!b.DOCDATE) return -1;
      return a.DOCDATE < b.DOCDATE ? 1 : -1;
    });

    // Add row numbers
    mergedData = mergedData.map((row, idx) => ({ ...row, rowNum: idx + 1 }));

    return res.json(mergedData);
  } catch (err) {
    next(err);
  }
};

// ============================================================================
//                       Get Invoice by Code/Doc no.
// ============================================================================
exports.getInvoiceByCode = async (req, res, next) => {
  try {
    const docno = req.params.docno;
    const fdb = getConnection('firebird');
    const customer_query = `SELECT
                              t1.DOCKEY,
                              t1.DOCNO AS "InvoiceCode",
                              t1.DUEDATE AS "DueDate",
                              t1.LOCALDOCAMT AS "TotalAmount",
                              (t1.LOCALDOCAMT - t1.PAYMENTAMT) AS "CurrentBalance",
                              t1.DESCRIPTION AS "Description",
                              t2.COMPANYNAME AS "CompanyName",
                              t2.CODE AS "CompanyCode",
                              t3.ATTENTION AS "ContactPerson",
                              t1.DOCDATE AS "InvoiceDate",
                              t3.ADDRESS1 AS "Address1",
                              t3.ADDRESS2 AS "Address2",
                              t3.ADDRESS3 AS "Address3",
                              t3.ADDRESS4 AS "Address4",
                              t4.DESCRIPTION AS "Description2",
                              SUM(t4.TAXAMT) AS "TaxTotalAmount"
                            FROM
                              AR_IV t1
                            JOIN AR_CUSTOMER t2 ON t2.CODE = t1.CODE
                            JOIN AR_CUSTOMERBRANCH t3 ON t3.CODE = t2.CODE
                            JOIN AR_IVDTL t4 ON t4.DOCKEY = t1.DOCKEY
                            WHERE
                              t1.DOCNO = ?
                            GROUP BY
                              t1.DOCKEY,
                              t1.DOCNO,
                              t2.COMPANYNAME,
                              t2.CODE,
                              t3.ATTENTION,
                              t1.DOCDATE,
                              t1.DUEDATE,
                              t1.LOCALDOCAMT,
                              t1.PAYMENTAMT,
                              t3.ADDRESS1,
                              t3.ADDRESS2,
                              t3.ADDRESS3,
                              t3.ADDRESS4,
                              t1.DESCRIPTION,
                              t4.DESCRIPTION`;
    const customer_res = await runQuery(fdb, customer_query, [docno]);
    if (customer_res.length === 0) {
      return res.status(404).json({ message: 'Invoice detail not found' });
    }

    return res.json(customer_res[0]);
  } catch (err) {
    next(err);
  }
};

exports.getInvoiceByCode2 = async (req, res, next) => {
  try {
    const docno = req.params.docno;

    const ar_iv = loadJson('ar_iv.json');               // invoice header
    const ar_customer = loadJson('ar_customer.json');   // customer info
    const ar_customerbranch = loadJson('ar_customerbranch.json'); // branch info
    const ar_ivdtl = loadJson('ar_ivdtl.json');         // invoice lines

    // Find the invoice header
    const invoiceHeader = ar_iv.find(inv => inv.DOCNO === docno);
    if (!invoiceHeader) return res.status(404).json({ message: 'Invoice detail not found' });

    // Find customer
    const customer = ar_customer.find(c => c.CODE === invoiceHeader.CODE);
    // Find customer branch
    const branch = ar_customerbranch.find(b => b.CODE === invoiceHeader.CODE);
    // Find invoice details (lines)
    const invoiceLines = ar_ivdtl.filter(line => line.DOCKEY === invoiceHeader.DOCKEY);

    // Aggregate tax total
    const taxTotal = invoiceLines.reduce((sum, line) => sum + (line.TAXAMT || 0), 0);

    // Build response like your old query
    const invoice = {
      DOCKEY: invoiceHeader.DOCKEY,
      DOCNO: invoiceHeader.DOCNO,
      DueDate: invoiceHeader.DUEDATE,
      TotalAmount: invoiceHeader.LOCALDOCAMT,
      CurrentBalance: invoiceHeader.LOCALDOCAMT - invoiceHeader.PAYMENTAMT,
      Description: invoiceHeader.DESCRIPTION,
      CompanyName: customer?.COMPANYNAME || null,
      CompanyCode: customer?.CODE || null,
      ContactPerson: branch?.ATTENTION || null,
      InvoiceDate: invoiceHeader.DOCDATE,
      Address1: branch?.ADDRESS1 || null,
      Address2: branch?.ADDRESS2 || null,
      Address3: branch?.ADDRESS3 || null,
      Address4: branch?.ADDRESS4 || null,
      Description2: invoiceLines[0]?.DESCRIPTION || null,
      TaxTotalAmount: taxTotal
    };

    return res.json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.getOpenInvoicesByCustomer = async (req, res, next) => {
  console.log("hello");
  try {
    const customerCode = req.params.code;

    const ar_iv = loadJson('ar_iv.json');
    const ar_knockoff = loadJson('ar_knockoff.json');
    const ar_pm = loadJson('ar_pm.json');
    const ar_cn = loadJson('ar_cn.json');

    // 1. Load ALL invoices for the customer
    const customerInvoices = ar_iv.filter(
      inv => inv.CODE === customerCode
    );
    console.log(`Found ${customerInvoices.length} invoices for customer ${customerCode}`);

    const invoices = customerInvoices.map(inv => {
      const invoiceDockey = inv.DOCKEY;
      const invoiceAmount = Number(inv.LOCALDOCAMT) || 0;

      // 2. Get knockoffs for THIS invoice (may be empty)
      const knockoffRows = ar_knockoff.filter(k =>
        k.TODOCTYPE === 'IV' &&
        k.TODOCKEY === invoiceDockey &&
        ['PM', 'CN'].includes(k.FROMDOCTYPE)
      );

      // 3. Build knockoff detail list
      const knockoffList = knockoffRows.map(k => {
        let sourceDoc = null;

        if (k.FROMDOCTYPE === 'PM') {
          sourceDoc = ar_pm.find(p => p.DOCKEY === k.FROMDOCKEY);
        } else if (k.FROMDOCTYPE === 'CN') {
          sourceDoc = ar_cn?.find(c => c.DOCKEY === k.FROMDOCKEY);
        }

        return {
          KnockoffAmount: Number(k.LOCALKOAMT) || 0,
          KnockoffDate: k.KOTAXDATE,
          SourceDocType: k.FROMDOCTYPE, // PM | CN
          SourceDocKey: k.FROMDOCKEY,
          SourceDocNo: sourceDoc?.DOCNO ?? null,
          SourceDocDate: sourceDoc?.DOCDATE ?? null,
          SourceDocDescription: sourceDoc?.DESCRIPTION ?? null,
          SourceDocAmount: sourceDoc?.LOCALDOCAMT ?? null
        };
      });

      // 4. Aggregate knockoff amount
      const totalKnockoff = knockoffList.reduce(
        (sum, k) => sum + k.KnockoffAmount,
        0
      );

      // 5. Calculate available amount (clamped)
      const availableAmount = Math.max(
        Number((invoiceAmount - totalKnockoff).toFixed(2)),
        0
      );

      // 6. Determine status
      let status = 'OPEN';
      if (totalKnockoff > 0 && availableAmount > 0) status = 'PARTIAL';
      if (availableAmount === 0) status = 'PAID';

      return {
        docno: inv.DOCNO,
        dockey: invoiceDockey,
        docdate: inv.DOCDATE,
        amount: invoiceAmount,
        TotalKnockoffAmount: Number(totalKnockoff.toFixed(2)),
        AvailableAmount: availableAmount,
        status: status,
        KnockoffList: knockoffList
      };
    });

    // 7. Return ONLY unpaid / partially paid invoices
    const openInvoices = invoices.filter(
      inv => inv.AvailableAmount > 0
    );

    return res.json(openInvoices);

  } catch (err) {
    next(err);
  }
};

// ============================================================================
//   SIMPLE Outstanding (from ar_iv.json only):
//   - include only invoices where LOCALDOCAMT != PAYMENTAMT
//   - total = sum(LOCALDOCAMT - PAYMENTAMT) where diff > 0
//   - latestDueDate = max(DUEDATE) among included items
// ============================================================================
exports.getOutstandingFromArIvByCustomer = async (req, res, next) => {
  try {
    const customerCode = String(req.params.code || "").trim();
    if (!customerCode) return res.status(400).json({ message: "Missing customer code" });

    const ar_iv = loadJson("ar_iv.json");

    const rows = ar_iv.filter(inv => String(inv.CODE || "").trim() === customerCode);

    const items = rows
      .map(inv => {
        const local = Number(inv.LOCALDOCAMT ?? 0) || 0;
        const paid = Number(inv.PAYMENTAMT ?? 0) || 0;

        // ✅ only when NOT equal
        if (local === paid) return null;

        const outstanding = Number((local - paid).toFixed(2));

        return {
          DOCKEY: inv.DOCKEY,
          DOCNO: inv.DOCNO,
          DOCDATE: inv.DOCDATE ? formatDate(inv.DOCDATE) : null,
          DUEDATE: inv.DUEDATE ? formatDate(inv.DUEDATE) : null, // "YYYY-MM-DD"
          CODE: inv.CODE,
          LOCALDOCAMT: local,
          PAYMENTAMT: paid,
          OUTSTANDING: outstanding,
        };
      })
      .filter(Boolean)
      // optional safety: keep only positive outstanding
      .filter(x => x.OUTSTANDING > 0);

    const totalOutstanding = Number(
      items.reduce((sum, x) => sum + x.OUTSTANDING, 0).toFixed(2)
    );

    // ✅ latest due date among items (YYYY-MM-DD)
    const latestDueDate = items.reduce((latest, x) => {
      if (!x.DUEDATE) return latest;
      if (!latest) return x.DUEDATE;
      return x.DUEDATE > latest ? x.DUEDATE : latest; // works because YYYY-MM-DD lexicographical
    }, null);

    return res.json({
      code: customerCode,
      totalOutstanding,
      latestDueDate, // e.g. "2011-01-30"
      count: items.length,
      items,
    });
  } catch (err) {
    next(err);
  }
};

