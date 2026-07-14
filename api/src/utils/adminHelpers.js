// src/utils/adminHelpers.js
// custom helper functions for the customer dashboard Admin (memorial content) module.
const { runQuery } = require('../db/connectionManager');

// Verify the memorial (number_list) belongs to the logged-in customer (code_no),
// so one customer can never touch another customer's memorial content.
async function ownsMemorial(db, memorialId, codeNo) {
  if (!memorialId || !codeNo) return false;
  const rows = await runQuery(
    db,
    `SELECT 1 FROM mt_deceased WHERE number_list = $1 AND code_no = $2 LIMIT 1`,
    [String(memorialId), codeNo]
  );
  return rows.length > 0;
}

// Convenience: clean up uploaded files on failure.
const fs = require('fs');
function cleanupFiles(files = []) {
  files.forEach((f) => {
    if (f?.path && fs.existsSync(f.path)) {
      try {
        fs.unlinkSync(f.path);
      } catch (_) {
        /* ignore */
      }
    }
  });
}

module.exports = { ownsMemorial, cleanupFiles };