// src/controllers/memorialController.js

// Lightweight list of the logged-in customer's memorials, used by the shared
// module header (memorial dropdown + avatar + "View public page" link) across
// the customer dashboard modules (Love Giving, Admin, Obituary, etc.).

const { getConnection, runQuery } = require('../db/connectionManager');

/**
 * GET /api/memorials
 * Returns [{ numberList, name, urlName, codeNo, photoUrl }] for the customer.
 */
exports.listMemorials = async (req, res) => {
  try {
    const codeNo = req.user?.codeNo;
    if (!codeNo) {
      return res.status(401).json({ message: 'Missing account scope (codeNo)' });
    }

    const db = getConnection(process.env.DB_TYPE);
    const query = `
      SELECT
        d.number_list   AS "numberList",
        d.memorial_name AS "name",
        d.url_name      AS "urlName",
        d.code_no       AS "codeNo",
        (
          SELECT o.mf_img
          FROM mt_obituary o
          WHERE o.memorial_id = d.number_list
          ORDER BY o.id DESC
          LIMIT 1
        ) AS "mfImg"
      FROM mt_deceased d
      WHERE d.show = TRUE
        AND d.code_no = $1
      ORDER BY d.number_list ASC
    `;
    const rows = await runQuery(db, query, [codeNo]);

    const memorials = (rows || []).map((row) => ({
      numberList: row.numberList,
      name: row.name,
      urlName: row.urlName,
      codeNo: row.codeNo,
      photoUrl: row.mfImg ? `/api/uploads/obituary/images/${row.mfImg}` : null,
    }));

    return res.json(memorials);
  } catch (error) {
    console.error('listMemorials error:', error);
    return res.status(500).json({ message: 'Failed to load memorials' });
  }
};