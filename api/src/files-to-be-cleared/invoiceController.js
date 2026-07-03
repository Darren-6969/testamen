const { getConnection, runQuery } = require('../db/connectionManager');
const fs = require('fs-extra');
const path = require('path');
const EXPORT_DIR = process.env.JSON_FILE_PATH;
const { loadJsonFast } = require('../utils/jsonLoader');
const { buildPhoneCDR } = require('../services/cdrService');
const { indexBy, groupBy } = require('../utils/jsonIndexes');

// format date
function formatDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  d.setHours(d.getHours() + 8);
  return d.toISOString().slice(0, 10); // Returns YYYY-MM-DD
}

function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}
function decodeCursor(str) {
  try { return JSON.parse(Buffer.from(str, 'base64url').toString('utf8')); }
  catch { return null; }
}

function parsePlanId(planId = '') {
  const idx = planId.indexOf('-');
  return (idx > 0 ? planId.slice(0, idx) : planId).trim();
}

// ============================================================================
//                       Get All Invoice
// ============================================================================
exports.getAllInvoices = async (req, res) => {
  try {
    const db  = getConnection(process.env.DB_TYPE);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    const docnoSearch       = req.query.docno       || '';
    const companynameSearch = req.query.companyname || '';
    const attentionSearch   = req.query.attention   || '';
    const cancelledSearch   = req.query.cancelled   || '';
    const docdateSearch     = req.query.docdate     || '';
    const localdocamtSearch = req.query.localdocamt || '';
    const paymentamtSearch = req.query.paymentamt || '';

    let cancelledFilter = null;
    if (cancelledSearch !== '') {
      const normalized = String(cancelledSearch).trim().toLowerCase();
      if (['true', '1', 'cancelled'].includes(normalized)) cancelledFilter = true;
      else if (['false', '0', 'active'].includes(normalized)) cancelledFilter = false;
    }

    const params = [limit + 1, docnoSearch, companynameSearch, attentionSearch, cancelledFilter, docdateSearch, localdocamtSearch, paymentamtSearch];
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
        AND ($5::boolean IS NULL OR iv.cancelled = $5::boolean)
        AND ($6 = '' OR iv.docdate::text ILIKE '%' || $6 || '%')
        AND ($7 = '' OR iv.localdocamt::text ILIKE '%' || $7 || '%')
        AND ($8 = '' OR iv.paymentamt::text ILIKE '%' || $8 || '%')
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
        DOCDATE:      formatDate(row.docdate),
        LOCALDOCAMT:  `RM${(+row.localdocamt || 0).toFixed(2)}`,
        PAYMENTAMT:  `RM${(+row.paymentamt || 0).toFixed(2)}`,
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
//                       Get Invoice by Code/Doc no.
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

exports.getCustomerTotalInvoiceAmount = async (req, res) => {
  try {
    const { code } = req.params;
    const invoices = await loadJsonFast('ar_iv.json');

    let totalInvoiceAmount = 0;

    for (const inv of invoices) {
      if (inv.CODE !== code) continue;
      totalInvoiceAmount += Number(inv.LOCALDOCAMT) || 0;
    }

    res.json({ totalInvoiceAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInvoiceHeader = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const docno = req.params.docno;
    const invoices = await loadJsonFast('ar_iv.json');
    const invoice = invoices.find(iv => iv.DOCNO === docno);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const customer = await loadJsonFast('ar_customer.json');
    const customerData = customer.find(c => c.CODE === invoice.CODE) || {};

    const deposit_query = `SELECT deposit_amt FROM reach10_mysql.deposit WHERE c_code = $1 LIMIT 1`;
    const deposit_value = [invoice.CODE];
    const deposit = await runQuery(db, deposit_query, deposit_value);

    const contract_query = `SELECT con_period FROM reach10_mysql.contract WHERE c_code = $1 LIMIT 1`;
    const contract_value = [invoice.CODE];
    const contract = await runQuery(db, contract_query, contract_value);


    return res.status(200).json({
      accountNo: customerData.CODE || null,
      accountName: customerData.COMPANYNAME || null,
      billDate: invoice.DOCDATE || null,
      contract: contract[0]?.con_period || null,
      deposit: 'RM ' + (Number(deposit[0]?.deposit_amt) || 0).toFixed(2),
      billingPeriod: invoice.DESCRIPTION?.substring(16) || null,
    })

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.getAllCustomerKnockoffs = async (req, res) => {
  try {
    const customerCode = req.params.code;

    const [
      ar_iv,
      ar_knockoff,
      ar_pm,
      ar_cn
    ] = await Promise.all([
      loadJsonFast('ar_iv.json'),
      loadJsonFast('ar_knockoff.json'),
      loadJsonFast('ar_pm.json'),
      loadJsonFast('ar_cn.json'),
    ]);

    const invoices = ar_iv.filter(inv => inv.CODE === customerCode);

    const pmMap = indexBy(ar_pm, 'DOCKEY');
    const cnMap = indexBy(ar_cn, 'DOCKEY');
    const knockoffMap = {};
    for (const k of ar_knockoff) {
      if (k.TODOCTYPE === 'IV' && (k.FROMDOCTYPE === 'PM' || k.FROMDOCTYPE === 'CN')) {
        (knockoffMap[k.TODOCKEY] ||= []).push(k);
      }
    }
    const result = [];

    for (const inv of invoices) {
      const knockoffs = knockoffMap[inv.DOCKEY] || [];

      let totalKnockoff = 0;
      const knockoffList = [];

      for (const k of knockoffs) {
        const amount = +k.LOCALKOAMT || 0;
        totalKnockoff += amount;

        const source =
          k.FROMDOCTYPE === 'PM'
            ? pmMap[k.FROMDOCKEY]
            : cnMap[k.FROMDOCKEY];

        knockoffList.push({
          KnockoffAmount: amount,
          KnockoffDate: k.KOTAXDATE,
          SourceDocType: k.FROMDOCTYPE,
          SourceDocKey: k.FROMDOCKEY,
          SourceDocNo: source?.DOCNO ?? null,
          SourceDocDate: source?.DOCDATE ?? null,
          SourceDocDescription: source?.DESCRIPTION ?? null,
          SourceDocAmount: source?.LOCALDOCAMT ?? null
        });
      }
      result.push({
        docno: inv.DOCNO,
        dockey: inv.DOCKEY,
        docdate: inv.DOCDATE,
        amount: inv.LOCALDOCAMT || 0,
        PAYMENTAMT: inv.PAYMENTAMT || 0,
        paymentdoc: knockoffList,
      });

    }
    return res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

}

// Get invoice details for PDF generation (totals, summary, payment slip, etc.)
exports.getBillDetails = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const docno = req.params.docno;

    const invoice_query = `SELECT * FROM billing_fb.ar_iv WHERE docno = $1 LIMIT 1`;
    const invoice_value = [docno];
    const invoice = await runQuery(db, invoice_query, invoice_value);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const bill_date = new Date(invoice[0].docdate);
    const billDate = bill_date.toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const due_date = invoice[0].duedate ? new Date(invoice[0].duedate) : null;
    const dueDate = due_date && !Number.isNaN(due_date.getTime())
      ? due_date.toLocaleDateString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).replace(/ /g, '-')
      : '';

    const billingPeriod = invoice[0].description?.substring(16) || '';
    const billDateStr = formatDate(billDate); // invoice bill date
    const periodMatch = billingPeriod.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/);
    const periodStart = periodMatch
      ? `${periodMatch[3]}-${periodMatch[2]}-${periodMatch[1]}`
      : null;
    const periodEnd = periodMatch
      ? `${periodMatch[6]}-${periodMatch[5]}-${periodMatch[4]}`
      : null;

    const gl_trans_query = `SELECT docdate, localdr, localcr FROM billing_fb.gl_trans WHERE code = $1 AND cancelled = false ORDER BY docdate ASC`;
    const gl_trans_value = [invoice[0].code];
    const glTrans = await runQuery(db, gl_trans_query, gl_trans_value);

    let overdueAmount = 0;
    let totalToCurrentBill = 0;
    let previousBalance = 0;
    let periodPaymentSum = 0;
    let lastPaymentDate = null;
    let foundPayment = false;

    for (const t of glTrans || []) {
      if (!t.docdate) continue;
      const docDateStr = formatDate(t.docdate); // gl_trans date
      const amount = (+t.localdr || 0) - (+t.localcr || 0);

      if (docDateStr < billDateStr) {
        overdueAmount += amount;
      }
      if (docDateStr <= billDateStr) {
        totalToCurrentBill += amount;
      }

      if (periodStart && (docDateStr < periodStart)) {
        previousBalance += amount;
      }

      if (periodStart && periodEnd && (docDateStr >= periodStart) && (docDateStr <= periodEnd)) {
        const payment = +t.localcr || 0;
        if (payment > 0) {
          periodPaymentSum += payment;
          foundPayment = true;
          if (!lastPaymentDate || docDateStr > lastPaymentDate) {
            lastPaymentDate = docDateStr;
          }
        }
      }
    }

    const totalAmountDue = Number((totalToCurrentBill).toFixed(2));

    const paymentDateToUse = foundPayment ? lastPaymentDate : (periodEnd || '');
    const formattedLastPaymentDate = paymentDateToUse
      ? new Date(paymentDateToUse).toLocaleDateString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).replace(/ /g, '-')
      : '';
    const totalPaymentReceivedAmount = `-${Math.abs(periodPaymentSum).toFixed(2)}`;

    const customer_query = `SELECT * FROM billing_fb.ar_customer JOIN billing_fb.ar_customerbranch ON billing_fb.ar_customerbranch.code = billing_fb.ar_customer.code WHERE ar_customer.code = $1 LIMIT 1`;
    const customer_value = [invoice[0].code];
    const customerData = await runQuery(db, customer_query, customer_value);

    const deposit_query = `SELECT deposit_amt FROM reach10_mysql.deposit WHERE c_code = $1 LIMIT 1`;
    const deposit_value = [invoice[0].code];
    const deposit = await runQuery(db, deposit_query, deposit_value);

    const contract_query = `SELECT con_period FROM reach10_mysql.contract WHERE c_code = $1 LIMIT 1`;
    const contract_value = [invoice[0].code];
    const contract = await runQuery(db, contract_query, contract_value);

    const first_invoice_query = `SELECT docno FROM billing_fb.ar_iv WHERE code = $1 AND cancelled = false ORDER BY docdate ASC LIMIT 1`;
    const first_invoice_value = [invoice[0].code];
    const firstInvoice = await runQuery(db, first_invoice_query, first_invoice_value);
    const isFirstInvoice = firstInvoice?.[0]?.docno === invoice[0].docno;

    const IV_query = `SELECT * FROM billing_fb.ar_iv WHERE code = $1 AND docno LIKE 'IV%' AND docdate BETWEEN $2 AND $3 AND cancelled = false`;
    const IV_value = [invoice[0].code, periodStart, periodEnd];
    const IVs = await runQuery(db, IV_query, IV_value);

    const CN_query = `SELECT * FROM billing_fb.ar_cn WHERE code = $1 AND docdate BETWEEN $2 AND $3 AND cancelled = false`;
    const CN_value = [invoice[0].code, periodStart, periodEnd];
    const CNs = await runQuery(db, CN_query, CN_value);

    const DN_query = `SELECT * FROM billing_fb.ar_dn WHERE code = $1 AND docdate BETWEEN $2 AND $3 AND cancelled = false`;
    const DN_value = [invoice[0].code, periodStart, periodEnd];
    const DNs = await runQuery(db, DN_query, DN_value);

    const detail_query = `
      SELECT
        t1.description AS description,
        t1.taxableamt AS amount
      FROM billing_fb.ar_ivdtl t1
      JOIN billing_fb.ar_iv t2 ON t2.dockey = t1.dockey
      WHERE t2.docno = $1
    `;
    const detail_value = [invoice[0].docno];
    const detailRows = await runQuery(db, detail_query, detail_value);

    const nonVoiceDescriptions = Array.from(new Set(
      (detailRows || [])
        .map(r => (r.description || '').trim())
        .filter(d => d && d.toLowerCase() !== 'voice')
    ));

    let packageNameSet = new Set();
    if (nonVoiceDescriptions.length > 0) {
      const placeholders = nonVoiceDescriptions.map((_, idx) => `$${idx + 1}`).join(', ');
      const package_query = `SELECT package_name FROM package WHERE package_name IN (${placeholders})`;
      const packageRows = await runQuery(db, package_query, nonVoiceDescriptions);
      packageNameSet = new Set((packageRows || []).map(p => (p.package_name || '').trim()));
    }

    const detailItems = [];
    const additionalDescriptionItems = [];
    let totalAmountNum = 0;
    for (const row of detailRows || []) {
      const desc = (row.description || '').trim();
      const amountNum = Number(row.amount || 0);
      if (!desc) continue;
      const descLower = desc.toLowerCase();

      if (descLower === 'voice' && amountNum !== 0) {
        detailItems.push({
          label: desc,
          amount: amountNum.toFixed(2),
          indent: 2,
        });
      } else if (packageNameSet.has(desc)) {
        detailItems.push({
          label: desc,
          amount: amountNum.toFixed(2),
          indent: 2,
        });
      } else if (descLower !== 'calls') {
        // Legacy $newdescription: non-package extra descriptions excluding Voice/Calls.
        additionalDescriptionItems.push({
          label: desc,
          amount: amountNum.toFixed(2),
        });
      }
      
      if (descLower !== 'calls') {
        totalAmountNum += amountNum;
      }
    }

    let localCallCharges = 0;
    let trunkCallCharges = 0;
    let mobileCallCharges = 0;
    let internationalCallCharges = 0;
    const cdrPhones = [];

    if (periodStart && periodEnd) {
      const site_query = `
        SELECT ss.system_type, ss.bill_code
        FROM reach10_mysql.site_detail sd
        LEFT JOIN reach10_mysql.site_setting ss ON sd.site_id = ss.id
        WHERE sd.customer_code = $1
        LIMIT 1
      `;
      const site_value = [invoice[0].code];
      const siteRows = await runQuery(db, site_query, site_value);
      const systemType = siteRows?.[0]?.system_type || 'mssql';
      let billCode = siteRows?.[0]?.bill_code || '';
      if (billCode === 'DI') billCode = 'RR';

      const phone_query = `
        SELECT
          cp.cpl_phoneno AS phone,
          cp.cpl_extensionline AS extension,
          cp.planid AS plan
        FROM reach10_mysql.customer_phoneline cp
        LEFT JOIN reach10_mysql.customer_phoneline_detail cpd
          ON cp.cpl_debtorcode = cpd.debtorcode
        WHERE cpd.status ILIKE 'Active'
          AND cp.cpl_status ILIKE 'Active'
          AND cpd.debtorcode = $1
      `;
      const phoneRows = await runQuery(db, phone_query, [invoice[0].code]);

      const iddRates = await runQuery(
        db,
        `SELECT idd_code, idd_sec, idd_rate FROM reach10_mysql.idd_rates WHERE pack_id = $1`,
        ['1']
      );

      for (const phone of phoneRows || []) {
        const plan = parsePlanId(phone.plan || '') || '1';
        const stdRates = await runQuery(
          db,
          `SELECT std_code, std_sec_rate, std_sec_rate_2, std_sec, std_sec_2 FROM reach10_mysql.std_rates WHERE pack_id = $1`,
          [plan]
        );

        let calls = [];
        if (systemType === 'dbf' && phone.extension != '') {
          const dbf_query = `
            SELECT call_date, call_sec, dial_no, start_time
            FROM reach10_callrecord.callrecord_dbf
            WHERE extension_id = $1
              AND call_date BETWEEN $2 AND $3
              AND server_site LIKE $4
              AND call_sec <> 0
            ORDER BY call_date ASC, id ASC
          `;
          const dbfRows = await runQuery(db, dbf_query, [
            phone.extension,
            periodStart,
            periodEnd,
            `%${billCode}%`,
          ]);
          calls = (dbfRows || []).map(r => ({
            date: r.call_date,
            time: r.start_time,
            to: r.dial_no,
            duration: Number(r.call_sec || 0),
          }));
        } else {
          const mssql_query = `
            SELECT call_date, call_duration, call_to, call_time
            FROM reach10_callrecord.callrecord_mssql
            WHERE TRIM(call_from) = $1
              AND call_date BETWEEN $2 AND $3
            ORDER BY call_date ASC, id ASC
          `;
          const mssqlRows = await runQuery(db, mssql_query, [
            phone.phone,
            periodStart,
            periodEnd,
          ]);
          calls = (mssqlRows || []).map(r => ({
            date: r.call_date,
            time: r.call_time,
            to: r.call_to,
            duration: Number(r.call_duration || 0),
          }));
        }

        const phoneCDR = await buildPhoneCDR({
          phoneNumber: phone.phone,
          extension: phone.extension,
          plan,
          sourceType: systemType,
          calls,
          stdRates,
          iddRates
        });

        localCallCharges += phoneCDR.local.total;
        trunkCallCharges += phoneCDR.trunk.total;
        mobileCallCharges += phoneCDR.mobile.total;
        internationalCallCharges += phoneCDR.international.total;

        const totalCalls =
          phoneCDR.local.count +
          phoneCDR.trunk.count +
          phoneCDR.mobile.count +
          phoneCDR.international.count;
        if (totalCalls > 0) {
          cdrPhones.push(phoneCDR);
        }
      }
    }

    const filteredIVs = isFirstInvoice
      ? (IVs || []).filter(iv => iv.docno !== invoice[0].docno)
      : (IVs || []);

    const summaryInvoices = filteredIVs.map(iv => ({
      ref: iv.docno,
      amount: Number(iv.localdocamt || 0).toFixed(2),
    }));

    const summaryCreditNotes = (CNs || []).map(cn => ({
      ref: cn.docno,
      amount: Number(cn.localdocamt || 0).toFixed(2),
    }));

    const summaryDebitNotes = (DNs || []).map(dn => ({
      ref: dn.docno,
      amount: Number(dn.localdocamt || 0).toFixed(2),
    }));

    const ivTotal = summaryInvoices.reduce((s, iv) => s + Number(iv.amount || 0), 0);
    const cnTotal = summaryCreditNotes.reduce((s, cn) => s + Number(cn.amount || 0), 0);
    const dnTotal = summaryDebitNotes.reduce((s, dn) => s + Number(dn.amount || 0), 0);

    const balanceForwardValue = previousBalance - periodPaymentSum + ivTotal + dnTotal - cnTotal;

    const beforeTaxTotal = Number(totalAmountNum + localCallCharges + trunkCallCharges + mobileCallCharges + internationalCallCharges).toFixed(2);
    const serviceTax = Number(beforeTaxTotal * 0.06).toFixed(2);

    return res.status(200).json({
      billNo: invoice[0].docno || '',
      accountNo: customerData[0].code || '',
      accountName: customerData[0].companyname || '',
      phoneOrPin: 'Please Refer To Next Page',
      billDate: billDate || '',
      contract: contract[0]?.con_period || '',
      deposit: 'RM ' + (Number(deposit[0]?.deposit_amt) || 0).toFixed(2),
      billingPeriod: billingPeriod,

      overdueAmount: overdueAmount.toFixed(2),
      currentChargesDueDate: dueDate,
      totalAmountDue: totalAmountDue,

      summary: {
        previousBalance: Number(previousBalance.toFixed(2)).toFixed(2),
        totalPaymentReceivedDate: formattedLastPaymentDate,
        totalPaymentReceivedAmount: totalPaymentReceivedAmount,
        adjustment: '0.00',
        invoices: summaryInvoices,
        creditNotes: summaryCreditNotes,
        debitNotes: summaryDebitNotes,
        balanceForward: Number(balanceForwardValue.toFixed(2)).toFixed(2),
        currentChargesTitle: 'Current Charges',
        monthlyChargesTitle: 'Monthly Charges',
        items: [
          ...detailItems,
          { label: 'Local Call Charges', amount: Number(localCallCharges || 0).toFixed(2) },
          { label: 'Trunk Call Charges', amount: Number(trunkCallCharges || 0).toFixed(2) },
          { label: 'Mobile Call Charges', amount: Number(mobileCallCharges || 0).toFixed(2) },
          { label: 'International Call Charges', amount: Number(internationalCallCharges || 0).toFixed(2) },
          ...additionalDescriptionItems,
          { label: 'Total Before Service Tax', amount: Number(beforeTaxTotal).toFixed(2) },
          { label: 'Service Tax 6%', amount: Number(serviceTax).toFixed(2) },
        ],
        totalCurrentCharges: invoice[0].localdocamt ? Number(invoice[0].localdocamt).toFixed(2) : '0.00',
      },

      customerAddressLines: [
        customerData[0].companyname || '',
        customerData[0].address1 || '',
        customerData[0].address2 || '',
        customerData[0].address3 || '',
        customerData[0].address4 || '',
      ],

      attn: customerData[0].attention || '',
      cdr: {
        phones: cdrPhones,
      },
    })

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
