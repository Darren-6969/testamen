// src/controllers/paymentMobileController.js
const { getConnection, runQuery } = require('../db/connectionManager');
const fs = require("fs");
const path = require("path"); 
// -----------------------------
// Helpers (local to controller)
// -----------------------------
const __jsonCache = new Map();

function loadJson(filename) {
  const base = process.env.JSON_FILE_PATH;

  if (base) {
    const resolved = path.resolve(base);

    if (fs.existsSync(resolved)) {
      const stat = fs.statSync(resolved);

      // ✅ if it's a directory, append filename (ar_iv.json)
      const finalPath = stat.isDirectory() ? path.join(resolved, filename) : resolved;

      if (!fs.existsSync(finalPath)) {
        throw new Error(`JSON file not found: ${finalPath}`);
      }

      if (__jsonCache.has(finalPath)) return __jsonCache.get(finalPath);

      const raw = fs.readFileSync(finalPath, "utf8");
      const data = JSON.parse(raw);
      __jsonCache.set(finalPath, data);
      return data;
    }
  }

  // fallback (optional): relative to project
  const fallback = path.join(process.cwd(), "src", "data", filename);
  if (!fs.existsSync(fallback)) {
    throw new Error(`Cannot find ${filename}. JSON_FILE_PATH not valid and fallback missing: ${fallback}`);
  }

  if (__jsonCache.has(fallback)) return __jsonCache.get(fallback);

  const raw = fs.readFileSync(fallback, "utf8");
  const data = JSON.parse(raw);
  __jsonCache.set(fallback, data);
  return data;
}

/**
 * Convert input date to "YYYY-MM-DD" if possible.
 * Accepts "YYYY-MM-DD", ISO string, Date, or numeric "YYYYMMDD".
 */
function formatDate(input) {
  if (!input) return null;

  // numeric yyyymmdd
  if (typeof input === "number" || /^\d{8}$/.test(String(input))) {
    const s = String(input);
    const yyyy = s.slice(0, 4);
    const mm = s.slice(4, 6);
    const dd = s.slice(6, 8);
    return `${yyyy}-${mm}-${dd}`;
  }

  // already yyyy-mm-dd
  const str = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // try Date parse (ISO etc.)
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeStatus(row) {
  // if (row.status_id !== undefined && row.status_id !== null) {
  //   return Number(row.status_id) === 2 ? "ACTIVE" : "INACTIVE";
  // }
  if (row.acc_status) {
    const s = String(row.acc_status).toUpperCase();
    if (s === "ACTIVE" || s === "INACTIVE" || s === "BARRED") return s;
  }
  return "ACTIVE";
}

function dedupeCustomersByCode(rows) {
  const seen = new Set();
  const uniqueRows = [];

  for (const row of rows || []) {
    const code = String(row.customer_code || "").trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    uniqueRows.push(row);
  }

  return uniqueRows;
}

function mapAccounts(rows, outstandingMap) {
  return (rows || []).map((row) => {
    const code = String(row.customer_code || "").trim();
    const out = outstandingMap.get(code) || { totalOutstanding: 0, latestDueDate: null };

    return {
      id: Number(row.id),
      account_no: code,
      status: normalizeStatus(row),
      outstanding_amount: Number(out.totalOutstanding || 0),
      due_date: out.latestDueDate,
    };
  });
}

async function fetchOutstandingMap(db, codes) {
  const uniqueCodes = Array.from(
    new Set((codes || []).map((code) => String(code || "").trim()).filter(Boolean))
  );

  if (uniqueCodes.length === 0) {
    return new Map();
  }

  const placeholders = uniqueCodes.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await runQuery(
    db,
    `
    SELECT
      code,
      SUM(
        CASE
          WHEN (COALESCE(localdocamt, 0) - COALESCE(paymentamt, 0)) > 0
          THEN (COALESCE(localdocamt, 0) - COALESCE(paymentamt, 0))
          ELSE 0
        END
      ) AS total_outstanding,
      MAX(
        CASE
          WHEN (COALESCE(localdocamt, 0) - COALESCE(paymentamt, 0)) > 0
          THEN duedate
          ELSE NULL
        END
      ) AS latest_due_date
    FROM billing_fb.ar_iv
    WHERE code IN (${placeholders})
    GROUP BY code
    `,
    uniqueCodes
  );

  const map = new Map();
  for (const row of rows || []) {
    const code = String(row.code || "").trim();
    if (!code) continue;

    map.set(code, {
      totalOutstanding: Number(Number(row.total_outstanding || 0).toFixed(2)),
      latestDueDate: row.latest_due_date ? formatDate(row.latest_due_date) : null,
    });
  }

  return map;
}

// exports.getPaymentAccounts = async (req, res, next) => {
//   try {
//     const db = getConnection(process.env.DB_TYPE);

//     const { type } = req.body || {};
//     const tabType = type === "personal" ? "personal" : type === "others" ? "others" : null;

//     // ✅ OTHERS input from frontend
//     const rawCodes = Array.isArray(req.body?.codes) ? req.body.codes : [];
//     const oneCode =
//       req.body?.code ||
//       req.body?.accountNo ||
//       req.body?.account_no ||
//       req.body?.customerCode ||
//       req.body?.customer_code ||
//       "";

//     // unique + trim
//     const requestCodes = Array.from(
//       new Set([oneCode, ...rawCodes].map((x) => String(x || "").trim()).filter(Boolean))
//     ).slice(0, 50); // safety limit


//     if (!tabType) {
//       return res.status(400).json({ message: "Invalid type. Use 'personal' or 'others'." });
//     }

//     // ✅ must come from verifyToken middleware
//     // Prefer customer_code if you have it in token; fallback to customer_id
//     const authCustomerCode = String(req.user?.customer_code || req.user?.customerCode || "").trim();
//     const authUserId = req.user?.userId || null;

//     if (!authCustomerCode && !authUserId) {
//       return res.status(401).json({ message: "User not found!" });
//     }

//     // ---- Helpers ----
//     const normalizeStatus = (row) => {
//       // Best-effort mapping (adjust if your customer table uses different columns)
//       // If you have status_id like users: 2 = ACTIVE
//       if (row.status_id !== undefined && row.status_id !== null) {
//         return Number(row.status_id) === 2 ? "ACTIVE" : "INACTIVE";
//       }
//       if (row.status) {
//         const s = String(row.status).toUpperCase();
//         if (s === "ACTIVE" || s === "INACTIVE") return s;
//       }
//       return "ACTIVE"; // default
//     };

//     const calcOutstandingMap = (ar_iv) => {
//       // Build CODE -> { totalOutstanding, latestDueDate }
//       const map = new Map();

//       for (const inv of ar_iv || []) {
//         const code = String(inv.code || "").trim();
//         if (!code) continue;

//         const local = Number(inv.localdocamt ?? 0) || 0;
//         const paid = Number(inv.paymentamt ?? 0) || 0;

//         if (local === paid) continue;

//         const outstanding = Number((local - paid).toFixed(2));
//         if (!(outstanding > 0)) continue;

//         // Use your existing formatter if available; else keep raw
//         const due = inv.duedate ? formatDate(inv.duedate) : null; // must be "YYYY-MM-DD" ideally

//         const prev = map.get(code) || { totalOutstanding: 0, latestDueDate: null };

//         const nextTotal = Number((prev.totalOutstanding + outstanding).toFixed(2));

//         let nextLatest = prev.latestDueDate;
//         if (due) {
//           if (!nextLatest) nextLatest = due;
//           else nextLatest = due > nextLatest ? due : nextLatest; // works for YYYY-MM-DD
//         }

//         map.set(code, { totalOutstanding: nextTotal, latestDueDate: nextLatest });
//       }

//       return map;
//     };

//     // ---- Load outstanding JSON once ----
//     // const ar_iv = loadJson("ar_iv.json");
//     // const outstandingMap = calcOutstandingMap(ar_iv);

//     // load outstanding from db
//     const ar_iv = await runQuery(
//       db,
//       `SELECT code, localdocamt, paymentamt, duedate FROM billing_fb.ar_iv`
//     );
//     const outstandingMap = calcOutstandingMap(ar_iv);
//     // dbOutstandingMap will override JSON if both exist, assuming DB is more up-to-date

//     // ---- Resolve "base customer" from DB ----
//     let baseCustomer = null;

//     if (authCustomerCode) {
//       const baseRows = await runQuery(
//         db,
//         `
//         SELECT c.id, c.customer_code, c.customer_group_id, u.status_id, c.status
//         FROM customer
//         LEFT JOIN users u ON c.user_id = u.id
//         WHERE c.customer_code = $1
//         LIMIT 1;
//         `,
//         [authCustomerCode]
//       );
//       baseCustomer = baseRows?.[0] || null;
//     }else {
//       const baseRows = await runQuery(
//         db,
//         `
//         SELECT c.id, c.customer_code, c.customer_group_id, u.status_id, c.status
//         FROM users u 
//         LEFT JOIN customer c ON u.id = c.user_id
//         WHERE u.id = $1
//         LIMIT 1;
//         `,
//         [authUserId]
//       );
//       baseCustomer = baseRows?.[0] || null;
//     }

//     if (!baseCustomer) {
//       return res.status(404).json({ message: "Customer not found" });
//     }

//     // ---- Build PERSONAL accounts list ----
//     // Personal = self + same customer_group_id (when not 0)
//     let customers = [baseCustomer];

//     const groupId = Number(baseCustomer.customer_group_id ?? 0) || 0;
//     if (tabType === "personal" && groupId !== 0) {
//       const groupRows = await runQuery(
//         db,
//         `
//         SELECT c.id, c.customer_code, c.customer_group_id, u.status_id, c.status
//         FROM customer c
//         LEFT JOIN users u ON u.id = c.user_id
//         WHERE c.customer_group_id = $1
//         ORDER BY c.id ASC;
//         `,
//         [groupId]
//       );

//       customers = groupRows && groupRows.length ? groupRows : customers;
//     }

//     // if (tabType === "others") {
//     //   // Not defined in your rules yet: "others" = pay someone else.
//     //   // For now return empty list safely (frontend will show "No accounts found")
//     //   return res.json([]);
//     // }
//     if (tabType === "others") {
//       // If no saved codes yet, just return empty
//       if (requestCodes.length === 0) {
//         return res.json([]);
//       }

//       // Build SQL placeholders: $1,$2,$3...
//       const placeholders = requestCodes.map((_, i) => `$${i + 1}`).join(", ");

//       // ✅ MUST join users to get status_id (same as PERSONAL)
//       const rows = await runQuery(
//         db,
//         `
//         SELECT c.id, c.customer_code, c.customer_group_id, u.status_id, c.status
//         FROM customer c
//         LEFT JOIN users u ON u.id = c.user_id
//         WHERE c.customer_code IN (${placeholders})
//         ORDER BY c.id ASC;
//         `,
//         requestCodes
//       );

//       // Deduplicate by customer_code
//       const seen = new Set();
//       const unique = [];
//       for (const r of rows || []) {
//         const code = String(r.customer_code || "").trim();
//         if (!code) continue;
//         if (seen.has(code)) continue;
//         seen.add(code);
//         unique.push(r);
//       }

//       const data = unique.map((c) => {
//         const code = String(c.customer_code || "").trim();
//         const out = outstandingMap.get(code) || { totalOutstanding: 0, latestDueDate: null };

//         return {
//           id: Number(c.id),
//           account_no: code,
//           status: normalizeStatus(c),
//           outstanding_amount: Number(out.totalOutstanding || 0),
//           due_date: out.latestDueDate,
//         };
//       });

//       return res.json(data);
//     }


//     // ---- Deduplicate by customer_code ----
//     const seen = new Set();
//     const uniqueCustomers = [];
//     for (const c of customers) {
//       const code = String(c.customer_code || "").trim();
//       if (!code) continue;
//       if (seen.has(code)) continue;
//       seen.add(code);
//       uniqueCustomers.push(c);
//     }

//     // ---- Map to API output ----
//     const data = uniqueCustomers.map((c) => {
//       const code = String(c.customer_code || "").trim();
//       const out = outstandingMap.get(code) || { totalOutstanding: 0, latestDueDate: null };

//       return {
//         id: Number(c.id),
//         account_no: code, // ✅ from customer.customer_code
//         status: normalizeStatus(c),
//         outstanding_amount: Number(out.totalOutstanding || 0),
//         due_date: out.latestDueDate, // "YYYY-MM-DD" or null
//       };
//     });

//     return res.json(data);
//   } catch (err) {
//     console.error("Error in getPaymentAccounts:", err);
//     next(err);
//   }
// };

exports.getPaymentAccountsV2 = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const type = req.body?.type === "personal" ? "personal" : req.body?.type === "others" ? "others" : null;
    if (!type) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const rawCodes = Array.isArray(req.body?.codes) ? req.body.codes : [];
    const oneCode =
      req.body?.code ||
      req.body?.accountNo ||
      req.body?.account_no ||
      req.body?.customerCode ||
      req.body?.customer_code ||
      "";

    const requestCodes = Array.from(
      new Set([oneCode, ...rawCodes].map((x) => String(x || "").trim()).filter(Boolean))
    ).slice(0, 50);

    const authCustomerCode = String(req.user?.customer_code || req.user?.customerCode || "").trim();
    const authUserId = req.user?.userId || null;

    if (!authCustomerCode && !authUserId) {
      return res.status(401).json({ message: "User not found!" });
    }

    let baseCustomer = null;
    if (authCustomerCode) {
      const baseRows = await runQuery(
        db,
        `
        SELECT c.id, c.customer_code, c.customer_group_id, u.acc_status, c.status
        FROM customer c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.customer_code = $1
        LIMIT 1;
        `,
        [authCustomerCode]
      );
      baseCustomer = baseRows?.[0] || null;
    } else {
      const baseRows = await runQuery(
        db,
        `SELECT c.id, c.customer_code, c.customer_group_id, u.acc_status, c.status
          FROM users u 
          LEFT JOIN customer c ON u.id = c.user_id
          WHERE u.id = $1
          LIMIT 1;`,
        [authUserId]
      );
      baseCustomer = baseRows?.[0] || null;
    }

    if (!baseCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    let customers = [baseCustomer];
    const groupId = Number(baseCustomer.customer_group_id ?? 0) || 0;
    if (type === "personal" && groupId !== 0) {
      const groupRows = await runQuery(
        db,
        `
        SELECT c.id, c.customer_code, c.customer_group_id, u.acc_status, c.status
        FROM customer c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.customer_group_id = $1
        ORDER BY c.id ASC;
        `,
        [groupId]
      );
      customers = groupRows && groupRows.length ? groupRows : customers;
    } else if (type === "others") {
      const filteredCodes = requestCodes.filter((code) => code !== authCustomerCode);
      if (filteredCodes.length === 0) {
        return res.json([]);
      }

      const placeholders = filteredCodes.map((_, i) => `$${i + 1}`).join(", ");
      const params = [...filteredCodes];
      const conditions = [`c.customer_code IN (${placeholders})`];

      if (authCustomerCode) {
        params.push(authCustomerCode);
        conditions.push(`c.customer_code <> $${params.length}`);
      }

      if (groupId !== 0) {
        params.push(groupId);
        conditions.push(`COALESCE(c.customer_group_id, 0) <> $${params.length}`);
      }

      const rows = await runQuery(
        db,
        `
        SELECT c.id, c.customer_code, c.customer_group_id, u.acc_status, c.status
        FROM customer c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE ${conditions.join("\n        AND ")}
        ORDER BY c.id ASC;
        `,
        params
      );

      const uniqueRows = dedupeCustomersByCode(rows);
      const outstandingMap = await fetchOutstandingMap(
        db,
        uniqueRows.map((row) => row.customer_code)
      );
      const data = mapAccounts(uniqueRows, outstandingMap);

      return res.json(data);
    }

    const uniqueCustomers = dedupeCustomersByCode(customers);
    const outstandingMap = await fetchOutstandingMap(
      db,
      uniqueCustomers.map((customer) => customer.customer_code)
    );
    const data = mapAccounts(uniqueCustomers, outstandingMap);

    return res.json(data);
  } catch (err) {
    console.error("Error in getPaymentAccountsV2:", err);
    next(err);
  }
};
