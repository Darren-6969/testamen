const { getConnection, runQuery } = require('../db/connectionManager');
let MongoUser;

// ============================================================================
//                       MongoDB Model Initialization
// ============================================================================
// If Mongo is enabled, register the User model with the active Mongo connection
// so it can be queried. Otherwise, MongoUser remains undefined.
if (process.env.USE_MONGO === 'true') {
  const conn = getConnection('mongo');
  MongoUser = conn.model('User', require('../models/user').schema);
}

// ============================================================================
//                       Get All Devices
// ============================================================================
// This function fetches user data from whichever database is enabled:
//   - MySQL / Postgres: SELECT query with optional JOIN to user_role
//   - MongoDB: uses Mongoose find() with projection
// It supports field selection via JSON input in req.body:
// Example input: {"fields": ["users.id", "name", "email", "user_role.role_name","acc_status AS status"]}
// ============================================================================
exports.getAllDevices = async (req, res, next) => {
  try {
    // Extract requested fields
    const { fields } = req.body || {};
    let fieldList;

    if (Array.isArray(fields) && fields.length > 0) {
      // Prevent SQL injection by sanitizing column names:
      // - allow letters, numbers, underscore, dot, and space (for aliases)
      fieldList = fields
        .map(f => f.replace(/[^a-zA-Z0-9_\. ]/g, ''))
        .join(', ');
    }

    // Default query (all columns + join with user_role)
    const defaultQuery = `SELECT * FROM devices WHERE status = 'Active' ORDER BY device_code ASC`;

    // Query with selected fields if provided
    const queryWithCond = `SELECT ${fieldList} FROM devices WHERE status = 'Active' ORDER BY device_code ASC`;

    // ------------------------------------------------------------------------
    // Run Query
    // ------------------------------------------------------------------------
    try {
      const db = getConnection(process.env.DB_TYPE); // e.g. "mysql" or "postgres"
      const query = fieldList ? queryWithCond : defaultQuery;
      let rows = await runQuery(db, query);
      return res.json(rows);
    } catch (error) {
        console.error(err);
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

// get device by ID
exports.getDeviceById = async (req, res, next) => {
  try {
    const deviceId = req.params.id;
    const db = getConnection(process.env.DB_TYPE); // e.g. "mysql" or "postgres"
    const query = `SELECT * FROM devices WHERE id = $1`;
    const values = [deviceId];
    const result = await runQuery(db, query, values);
    if (result.length === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }
    return res.json(result[0]);
  } catch (err) {
    next(err);
  }
};

// Add device
exports.createDevice = async (req, res, next) => {
  console.log('Incoming device POST body:', req.body);
  try {
    const { device_code, device_name, device_price, remarks } = req.body;
    const db = getConnection(process.env.DB_TYPE); // e.g. "mysql" or "postgres"
    const query = `INSERT INTO devices (device_code, device_name, device_price, remarks)
                   VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [device_code, device_name, device_price, remarks];
    const result = await runQuery(db, query, values);
    return res.status(201).json(result[0]);
  } catch (err) {
    next(err);
  }
};

// Update device
exports.updateDevice = async (req, res, next) => {
  console.log('Incoming device PUT body:', req.body);
  try {
    const deviceId = req.params.id;
    const { device_code, device_name, device_price, remarks } = req.body;
    const db = getConnection(process.env.DB_TYPE);  // e.g. "mysql" or "postgres"
    const query = `UPDATE devices 
                   SET device_code = $1, device_name = $2, device_price = $3, remarks = $4
                    WHERE id = $5 RETURNING *`;
    const values = [device_code, device_name, device_price, remarks, deviceId];
    const result = await runQuery(db, query, values);
    if (result.length === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }
    return res.json(result[0]);
  } catch (err) {
    next(err);
  }
};
// Delete device
exports.deleteDevice = async (req, res, next) => {
  console.log('Incoming device DELETE for ID:', req.params.id);
  try {
    const deviceId = req.params.id;
    const db = getConnection(process.env.DB_TYPE);  // e.g. "mysql" or "postgres"
    const query = `UPDATE devices SET status = 'Inactive' WHERE id = $1 RETURNING *`;
    const values = [deviceId];
    const result = await runQuery(db, query, values);
    if (result.length === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }
    return res.json(result[0]);
  } catch (err) {
    next(err);
  }
};

// ============================================================================
//                       Get User Modules & Submodules
// ============================================================================
// This function returns a JSON array of modules accessible to the logged-in user.
// - The user's ID is taken from req.user.userId (must be set by auth middleware).
// - It checks user_module_access table for access rights.
// - Each module may contain nested submodules.
// Example output:
//
// [
//   {
//     icon: "Home",
//     label: "Dashboard",
//     href: "/module/dashboard",
//     submodule: []
//   },
//   {
//     icon: "Users",
//     label: "Users",
//     href: "/module/users",
//     submodule: [
//       { label: "User Roles", href: "/module/user-roles" }
//     ]
//   }
// ]
// ============================================================================
exports.getUserModules = async (req, res, next) => {
  try {
    const userId = req.user.userId; // middleware should populate req.user

    // const mysqlPool = getConnection('mysql');
    const pgClient = getConnection('postgres');

    let rows;

    

      try {
        const db = getConnection(process.env.DB_TYPE); // e.g. "mysql" or "postgres"
        const query =`SELECT m.id as module_id, m.icon, m.display_name as label, m.url as href,
                s.id as submodule_id,  s.display_name as sub_label, s.url as sub_href
                FROM module m
                LEFT JOIN submodule s ON s.module_id = m.id
                INNER JOIN user_module_access uma 
                    ON uma.module_id = m.id AND uma.user_id = $1 AND uma.access = 1
                ORDER BY m.id, s.id`;
        rows = await runQuery(db, query, [userId]);
      } catch (error) {
        console.error(err);
        res.status(500).json({ error: 'No SQL database configured' });
      }
      

    // ------------------------------------------------------------------------
    // Convert flat resultset → nested JSON
    // ------------------------------------------------------------------------
    const modulesMap = {};
    for (const row of rows) {
      if (!modulesMap[row.module_id]) {
        modulesMap[row.module_id] = {
          icon: row.icon,
          label: row.label,
          href: row.href,
          submodule: []
        };
      }

      if (row.submodule_id) {
        modulesMap[row.module_id].submodule.push({
          label: row.sub_label,
          href: row.sub_href
        });
      }
    }

    const result = Object.values(modulesMap);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};
