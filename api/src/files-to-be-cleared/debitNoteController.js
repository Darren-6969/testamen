const { getConnection, runQuery } = require('../db/connectionManager');
// const dayjs = require('dayjs');
// const { loadJsonFast } = require('../utils/jsonLoader');
// const { indexBy } = require('../utils/jsonIndexes');

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

exports.getAllDebitNotes = async (req, res) => {
  try {
    const db     = getConnection(process.env.DB_TYPE);
    const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
    const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    const docnoSearch       = req.query.docno       || '';
    const companynameSearch = req.query.companyname || '';
    const attentionSearch   = req.query.attention   || '';
    const docdateSearch     = req.query.docdate     || '';
    const descriptionSearch   = req.query.description || '';
    const localdocamtSearch   = req.query.localdocamt || '';

    const params = [limit + 1, docnoSearch, companynameSearch, attentionSearch, docdateSearch, descriptionSearch, localdocamtSearch];
    // $1=limit, $2=docno, $3=companyname, $4=attention
    let cursorClause = '';

    if (cursor?.docdate && cursor?.dockey != null) {
      params.push(cursor.docdate, cursor.dockey);
      const p1 = params.length - 1;
      const p2 = params.length;
      cursorClause = `AND (dn.docdate < $${p1} OR (dn.docdate = $${p1} AND dn.dockey < $${p2}))`;
    }

    const rows = await runQuery(db, `
      SELECT
        dn.dockey,
        dn.docno,
        dn.docdate,
        dn.localdocamt,
        dn.description,
        c.companyname,
        cb.attention
      FROM billing_fb.ar_dn dn
      LEFT JOIN billing_fb.ar_customer c ON c.code = dn.code
      LEFT JOIN (
        SELECT DISTINCT ON (code) code, attention
        FROM billing_fb.ar_customerbranch
        ORDER BY code, dtlkey
      ) cb ON cb.code = dn.code
      WHERE dn.cancelled IS NOT TRUE
        AND ($2 = '' OR dn.docno ILIKE '%' || $2 || '%')
        AND ($3 = '' OR c.companyname ILIKE '%' || $3 || '%')
        AND ($4 = '' OR cb.attention ILIKE '%' || $4 || '%')
        AND ($5 = '' OR dn.docdate::text ILIKE '%' || $5 || '%')
        AND ($6 = '' OR dn.description ILIKE '%' || $6 || '%')
        AND ($7 = '' OR dn.localdocamt::text ILIKE '%' || $7 || '%')
        ${cursorClause}
      ORDER BY dn.docdate DESC, dn.dockey DESC
      LIMIT $1
    `, params);

    const hasMore = rows.length > limit;
    const data    = hasMore ? rows.slice(0, limit) : rows;
    const last    = data[data.length - 1];

    res.json({
      data: data.map((row, idx) => ({
        rowNum:      idx + 1,
        DOCDATE:     formatDate(row.docdate),
        DOCNO:       row.docno,
        LOCALDOCAMT: `RM${(+row.localdocamt || 0).toFixed(2)}`,
        DESCRIPTION: row.description ?? '',
        COMPANYNAME: row.companyname ?? '',
        ATTENTION:   row.attention ?? '',
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
    console.error('Error fetching debit notes:', err);
    res.status(500).json({ message: 'Failed to fetch debit notes' });
  }
};
