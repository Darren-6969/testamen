const { getConnection, runQuery } = require('../db/connectionManager');
const fs = require('fs-extra');
const path = require('path');
const EXPORT_DIR = process.env.JSON_FILE_PATH;
const { loadJsonFast } = require('../utils/jsonLoader');

exports.getCompanyProfile = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const rows = await runQuery(db, `
      SELECT *
      FROM billing_fb.sy_profile
      LIMIT 1
    `);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
