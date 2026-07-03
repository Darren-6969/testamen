// utils/audit.js
const jwt = require("jsonwebtoken");

function safeJson(obj) {
  return JSON.stringify(obj ?? null);
}

function stripSensitive(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const clone = { ...obj };
  if ("password" in clone) delete clone.password;
  return clone;
}

function diffObjects(before = {}, after = {}) {
  const changed = {};
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const k of keys) {
    const b = before?.[k];
    const a = after?.[k];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changed[k] = [b ?? null, a ?? null];
    }
  }
  return changed;
}

/**
 * resolveActor(req, db, runQuery)
 * - uses req.user if exists
 * - else decodes JWT from cookie/header
 * - if username missing, queries DB to get username
 */
async function resolveActor(req, db, runQuery) {
  // 1) from middleware
  if (req.user) {
    const actorUserId = req.user.userId ?? req.user.id ?? null;
    let actorUsername = req.user.username ?? req.user.name ?? null;

    if (actorUserId && !actorUsername) {
      const u = await runQuery(db, "SELECT username FROM users WHERE id = $1", [actorUserId]);
      actorUsername = u?.[0]?.username ?? null;
    }

    return { actorUserId, actorUsername };
  }

  // 2) fallback decode token
  let token = req.cookies?.token || null;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return { actorUserId: null, actorUsername: null };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const actorUserId = decoded.userId ?? decoded.id ?? null;
    let actorUsername = decoded.username ?? decoded.name ?? null;

    if (actorUserId && !actorUsername) {
      const u = await runQuery(db, "SELECT username FROM users WHERE id = $1", [actorUserId]);
      actorUsername = u?.[0]?.username ?? null;
    }

    // optional: attach back
    req.user = decoded;

    return { actorUserId, actorUsername };
  } catch {
    return { actorUserId: null, actorUsername: null };
  }
}

/**
 * logAudit(db, runQuery, payload)
 */
async function logAudit(db, maybeRunQueryOrPayload, maybePayload) {
  // Supports:
  // 1) logAudit(db, payload)
  // 2) logAudit(db, runQuery, payload)

  let runQueryFn;
  let payload;

  if (typeof maybeRunQueryOrPayload === "function") {
    runQueryFn = maybeRunQueryOrPayload;
    payload = maybePayload;
  } else {
    payload = maybeRunQueryOrPayload;
  }

  if (!payload) {
    throw new Error("logAudit called without payload");
  }

  // If runQuery wasn't passed, fallback to requiring it
  if (!runQueryFn) {
    const cm = require("../db/connectionManager");
    runQueryFn = cm.runQuery;
  }

  const {
    actor_user_id,
    actor_username,
    action,
    entity_table,
    entity_id,
    module,
    endpoint,
    description,
    before_data,
    after_data,
    changed_fields,
    ip_address,
    user_agent,
    request_id,
  } = payload;

  const q = `
    INSERT INTO audit_log
      (actor_user_id, actor_username, action, entity_table, entity_id,
       module, endpoint, description,
       before_data, after_data, changed_fields,
       ip_address, user_agent, request_id)
    VALUES
      ($1,$2,$3,$4,$5,
       $6,$7,$8,
       $9::jsonb,$10::jsonb,$11::jsonb,
       $12,$13,$14)
  `;

  const vals = [
    actor_user_id ?? null,
    actor_username ?? null,
    action,
    entity_table,
    entity_id ? String(entity_id) : null,
    module ?? null,
    endpoint ?? null,
    description ?? null,
    JSON.stringify(stripSensitive(before_data ?? null)),
    JSON.stringify(stripSensitive(after_data ?? null)),
    JSON.stringify(changed_fields ?? null),
    ip_address ?? null,
    user_agent ?? null,
    request_id ?? null,
  ];

  return runQueryFn(db, q, vals);
}


module.exports = { logAudit, diffObjects, resolveActor };
