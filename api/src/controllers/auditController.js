// controllers/auditController.js
const { getConnection, runQuery } = require('../db/connectionManager');
const ExcelJS = require('exceljs');

const AUDIT_TABLE = process.env.AUDIT_TABLE || 'audit_log';

// Helper: safe int
function toInt(val, fallback) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

// Helper: trim string or null
function s(val) {
  if (val === undefined || val === null) return null;
  const t = String(val).trim();
  return t ? t : null;
}

function pickSource(req) {
  // ✅ supports GET /audit/logs?x=... AND POST body
  return (req.method === 'GET' ? req.query : req.body) || {};
}

/**
 * GET  /api/audit/logs        (recommended for frontend axios.get)
 * POST /api/audit/logs        (also supported)
 *
 * filters (all optional):
 * page, limit,
 * module, action, entity_table, entity_id,
 * actor_user_id, actor_username,
 * date_from, date_to,   // ISO/date string
 * q                    // keyword search
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const src = pickSource(req);

    const page = Math.max(1, toInt(src.page, 1));
    const limit = Math.min(200, Math.max(1, toInt(src.limit, 20)));
    const offset = (page - 1) * limit;

    const module = s(src.module);
    const action = s(src.action);
    const entity_table = s(src.entity_table);
    const entity_id = s(src.entity_id);

    const actor_user_id =
      src.actor_user_id !== undefined && src.actor_user_id !== null
        ? toInt(src.actor_user_id, null)
        : null;

    const actor_username = s(src.actor_username);

    // const date_from = s(src.date_from);
    // const date_to = s(src.date_to);

    // const q = s(src.q);
    // ✅ accept BOTH naming styles
    const date_from = s(src.start_date || src.date_from);
    const date_to   = s(src.end_date   || src.date_to);

    // ✅ your UI sends `search`
    const q = s(src.search || src.q);

    const where = [];
    const params = [];
    let i = 1;

    if (module) {
      where.push(`module = $${i++}`);
      params.push(module);
    }

    if (action) {
      where.push(`action = $${i++}`);
      params.push(action);
    }

    if (entity_table) {
      where.push(`entity_table = $${i++}`);
      params.push(entity_table);
    }

    if (entity_id) {
      where.push(`entity_id = $${i++}`);
      params.push(entity_id);
    }

    if (actor_user_id !== null && Number.isFinite(actor_user_id)) {
      where.push(`actor_user_id = $${i++}`);
      params.push(actor_user_id);
    }

    if (actor_username) {
      where.push(`LOWER(actor_username) LIKE LOWER($${i++})`);
      params.push(`%${actor_username}%`);
    }

    // ✅ Inclusive date range in Asia/Kuala_Lumpur
    if (date_from) {
      // start date 00:00:00 (KL)
      where.push(`event_time >= (($${i++}::date)::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')`);
      params.push(date_from);
    }

    if (date_to) {
      // end date inclusive => < (end_date + 1 day) 00:00:00 (KL)
      where.push(`event_time < (((($${i++}::date) + INTERVAL '1 day')::timestamp) AT TIME ZONE 'Asia/Kuala_Lumpur')`);
      params.push(date_to);
    }

    // if (date_from) {
    //   // ✅ event_time >= date_from
    //   where.push(`event_time >= $${i++}`);
    //   params.push(date_from);
    // }

    // if (date_to) {
    //   // ✅ event_time <= date_to
    //   where.push(`event_time <= $${i++}`);
    //   params.push(date_to);
    // }

    if (q) {
      where.push(
        `
        (
          LOWER(COALESCE(actor_username,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(action,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(module,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(entity_table,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(entity_id,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(endpoint,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(description,'')) LIKE LOWER($${i})
        )
      `.trim()
      );
      params.push(`%${q}%`);
      i++;
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // total count
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM ${AUDIT_TABLE}
      ${whereSql}
    `;
    const countRows = await runQuery(db, countSql, params);
    const total = countRows?.[0]?.total ?? 0;

    // list
    const listSql = `
      SELECT
        id,
        event_time,
        actor_user_id,
        actor_username,
        action,
        module,
        entity_table,
        entity_id,
        endpoint,
        description,
        ip_address,
        user_agent,
        changed_fields
      FROM ${AUDIT_TABLE}
      ${whereSql}
      ORDER BY event_time DESC, id DESC
      LIMIT $${i} OFFSET $${i + 1}
    `;

    const listParams = [...params, limit, offset];
    const rows = await runQuery(db, listSql, listParams);

    return res.json({
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      rows: rows || [],
    });
  } catch (err) {
    console.error('❌ getAuditLogs error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to load audit logs', error: err.message });
  }
};

/**
 * GET /api/audit/logs/:id
 */
exports.getAuditLogById = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Invalid audit log id' });
    }

    const sql = `
      SELECT *
      FROM ${AUDIT_TABLE}
      WHERE id = $1
      LIMIT 1
    `;

    const rows = await runQuery(db, sql, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('❌ getAuditLogById error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to load audit log', error: err.message });
  }
};

// ✅ GET /api/audit/logs/excel
exports.exportAuditLogsExcel = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    // for GET, use req.query
    const src = req.query || {};

    const module = s(src.module);
    const action = s(src.action);
    const entity_table = s(src.entity_table);
    const entity_id = s(src.entity_id);

    const actor_user_id =
      src.actor_user_id !== undefined && src.actor_user_id !== null
        ? toInt(src.actor_user_id, null)
        : null;

    const actor_username = s(src.actor_username);

    const date_from = s(src.start_date || src.date_from);
    const date_to = s(src.end_date || src.date_to);

    const q = s(src.search || src.q);

    const where = [];
    const params = [];
    let i = 1;

    if (module) { where.push(`module = $${i++}`); params.push(module); }
    if (action) { where.push(`action = $${i++}`); params.push(action); }
    if (entity_table) { where.push(`entity_table = $${i++}`); params.push(entity_table); }
    if (entity_id) { where.push(`entity_id = $${i++}`); params.push(entity_id); }

    if (actor_user_id !== null && Number.isFinite(actor_user_id)) {
      where.push(`actor_user_id = $${i++}`);
      params.push(actor_user_id);
    }

    if (actor_username) {
      where.push(`LOWER(actor_username) LIKE LOWER($${i++})`);
      params.push(`%${actor_username}%`);
    }

    // ✅ date range inclusive (whole end day)
    if (date_from) {
      where.push(`event_time >= ($${i++}::date)::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur'`);
      params.push(date_from);
    }
    if (date_to) {
      where.push(`event_time < ((($${i++}::date + INTERVAL '1 day')::timestamp) AT TIME ZONE 'Asia/Kuala_Lumpur')`);
      params.push(date_to);
    }

    if (q) {
      where.push(`
        (
          LOWER(COALESCE(actor_username,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(action,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(module,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(entity_table,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(entity_id,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(endpoint,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(description,'')) LIKE LOWER($${i})
          OR LOWER(COALESCE(ip_address,'')) LIKE LOWER($${i})
        )
      `.trim());
      params.push(`%${q}%`);
      i++;
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // optional export limit
    const limit = Math.min(5000, Math.max(1, toInt(src.limit, 5000)));

    const sql = `
      SELECT
        id,
        event_time,
        actor_user_id,
        actor_username,
        action,
        module,
        entity_table,
        entity_id,
        endpoint,
        description,
        ip_address,
        user_agent,
        changed_fields
      FROM ${AUDIT_TABLE}
      ${whereSql}
      ORDER BY event_time DESC, id DESC
      LIMIT $${i}
    `;

    const rows = await runQuery(db, sql, [...params, limit]);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Audit Logs');

    ws.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Event Time', key: 'event_time', width: 26 },
      { header: 'Actor User ID', key: 'actor_user_id', width: 14 },
      { header: 'Actor Username', key: 'actor_username', width: 22 },
      { header: 'Action', key: 'action', width: 12 },
      { header: 'Module', key: 'module', width: 18 },
      { header: 'Entity Table', key: 'entity_table', width: 18 },
      { header: 'Entity ID', key: 'entity_id', width: 14 },
      { header: 'Endpoint', key: 'endpoint', width: 35 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'IP Address', key: 'ip_address', width: 18 },
      { header: 'User Agent', key: 'user_agent', width: 40 },
      { header: 'Changed Fields', key: 'changed_fields', width: 60 },
    ];

    (rows || []).forEach((r) => {
      ws.addRow({
        ...r,
        changed_fields:
          r?.changed_fields == null
            ? ''
            : (typeof r.changed_fields === 'string'
                ? r.changed_fields
                : JSON.stringify(r.changed_fields)),
      });
    });

    ws.getRow(1).font = { bold: true };

    const filename = `audit-logs-${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('❌ exportAuditLogsExcel error:', err);
    return res.status(500).json({ message: 'Failed to export audit logs', error: err.message });
  }
};
