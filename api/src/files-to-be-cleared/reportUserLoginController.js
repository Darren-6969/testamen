// src/controllers/reportUserLoginController.js
const { getConnection, runQuery } = require('../db/connectionManager');

function parseUserTypeId(raw) {
  const n = Number(raw);
  if (n === 1 || n === 2) return n;
  return null;
}

exports.getUserLastLoginList = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const userTypeId = parseUserTypeId(req.query.status_id);
    if (!userTypeId) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid status_id. Use 1 (staff) or 2 (customer).',
      });
    }

    // MySQL doesn't support "NULLS LAST", Postgres does.
    const dbType = (process.env.DB_TYPE || '').toLowerCase();
    const orderBy =
      dbType.includes('mysql')
        ? 'ORDER BY (last_login IS NULL) ASC, last_login DESC, name ASC'
        : 'ORDER BY last_login DESC NULLS LAST, name ASC';

    const sql = `
      SELECT id, name, username, email, last_login
      FROM users
      WHERE status_id = $1
      ${orderBy}
    `;

    const rows = await runQuery(db, sql, [userTypeId]);

    return res.json({
      ok: true,
      data: rows,
    });
  } catch (err) {
    console.error('getUserLastLoginList error:', err);
    return res.status(500).json({
      ok: false,
      message: 'Failed to load user last login list.',
    });
  }
};

// OPTIONAL: Excel export endpoint
exports.exportUserLastLoginExcel = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const userTypeId = parseUserTypeId(req.query.status_id);
    if (!userTypeId) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid status_id. Use 1 (staff) or 2 (customer).',
      });
    }

    let ExcelJS;
    try {
      ExcelJS = require('exceljs');
    } catch (e) {
      return res.status(501).json({
        ok: false,
        message:
          "Excel export not available (missing dependency). Run: npm i exceljs",
      });
    }

    const dbType = (process.env.DB_TYPE || '').toLowerCase();
    const orderBy =
      dbType.includes('mysql')
        ? 'ORDER BY (last_login IS NULL) ASC, last_login DESC, name ASC'
        : 'ORDER BY last_login DESC NULLS LAST, name ASC';

    const sql = `
      SELECT id, name, username, email, last_login
      FROM users
      WHERE status_id = $1
      ${orderBy}
    `;

    const rows = await runQuery(db, sql, [userTypeId]);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Last Login');

    ws.columns = [
      { header: '#', key: 'no', width: 6 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Last Login', key: 'last_login', width: 22 },
    ];

    rows.forEach((r, i) => {
      ws.addRow({
        no: i + 1,
        name: r.name || '',
        username: r.username || '',
        email: r.email || '',
        last_login: r.last_login || '',
      });
    });

    ws.getRow(1).font = { bold: true };

    const filename =
      userTypeId === 1 ? 'staff_last_login.xlsx' : 'customer_last_login.xlsx';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportUserLastLoginExcel error:', err);
    return res.status(500).json({
      ok: false,
      message: 'Failed to export user last login Excel.',
    });
  }
};
