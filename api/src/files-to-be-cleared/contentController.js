const fs   = require('fs');
const path = require('path');
const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword } = require('../utils/hashUtils'); // not used here but left as-is
const { logAudit, diffObjects, resolveActor } = require("../utils/audit");

let MongoUser;

// small helper
function safeUnlink(absPath) {
  if (!absPath) return;
  try {
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }
  } catch (err) {
    console.warn('Failed to delete file:', absPath, err.message);
  }
}

// ============================================================================
//                       MongoDB Model Initialization
// ============================================================================
if (process.env.USE_MONGO === 'true') {
  const conn = getConnection('mongo');
  MongoUser = conn.model('User', require('../models/user').schema);
}

// ============================================================================
//                       Get All Content
// ============================================================================
exports.getContent = async (req, res, next) => {
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

    const defaultQuery = `SELECT * FROM content WHERE status = 'ACTIVE'`;
    const queryWithCond = `SELECT ${fieldList} FROM content WHERE status = 'ACTIVE'`;

    try {
      const db = getConnection(process.env.DB_TYPE); // e.g. "mysql" or "postgres"
      const query = fieldList ? queryWithCond : defaultQuery;
      const rows  = await runQuery(db, query);
      return res.json(rows);
    } catch (error) {
      console.error('Error in getContent:', error);
      return res.status(500).json({ message: 'Failed to retrieve results' });
    }
  } catch (err) {
    next(err);
  }
};

// ============================================================================
//                       Get Single Content by ID
// ============================================================================
exports.getContentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getConnection(process.env.DB_TYPE);

    const query = `
      SELECT *
      FROM content
      WHERE id = $1
    `;

    const rows = await runQuery(db, query, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Content not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Error in getContentById:', error);
    return res.status(500).json({ message: 'Failed to load content', error: error.message });
  }
};

// ============================================================================
//                       Add New Content
// ============================================================================
// Expects multipart/form-data with fields:
//   name, type, display_status, start_date, end_date
// and an uploaded file under field name "image"
// ============================================================================

exports.addContent = async (req, res, next) => {
  try {
    console.log('BODY:', req.body);
    console.log('FILES:', req.files || req.file);

    const db = getConnection(process.env.DB_TYPE); // "mysql" or "postgres"

    // ✅ actor + metadata
    const { actorUserId, actorUsername } = await resolveActor(req, db);
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    const {
      name,
      type,
      display_status,
      start_date,
      end_date
    } = req.body || {};

    // ------------------------
    // Basic validation
    // ------------------------
    if (!name || !type) {
      return res.status(400).json({
        message: 'Both "name" and "type" are required'
      });
    }

    // ------------------------
    // Image handling (store path to folder)
    // ------------------------
    const basePath = '/uploads/content_images/';
    let imagePath = null;

    // Support: upload.single('image')
    if (req.file && req.file.filename) {
      imagePath = basePath + req.file.filename;
    }
    // Support: upload.fields({ name: 'image', maxCount: 1 })
    else if (req.files?.image?.[0]?.filename) {
      imagePath = basePath + req.files.image[0].filename;
    }
    // Fallback: if front-end directly sends a string (URL/path)
    else if (req.body.image) {
      imagePath = req.body.image;
    }

    const status = 'ACTIVE'; // default value

    const insertQuery = `
      INSERT INTO content (
        name,
        type,
        display_status,
        image,
        start_date,
        end_date,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const params = [
      name,
      type,
      display_status || null,
      imagePath,
      start_date || null,
      end_date || null,
      status
    ];

    const result = await runQuery(db, insertQuery, params);
    const newId = result?.[0]?.id;

    // ✅ AFTER snapshot (for audit)
    let after = null;
    if (newId) {
      const afterRows = await runQuery(db, `SELECT * FROM content WHERE id = $1`, [newId]);
      after = afterRows?.[0] ?? null;
    }

    // ✅ AUDIT: CREATE
    if (after) {
      await logAudit(db, {
        actor_user_id: actorUserId,
        actor_username: actorUsername,
        action: "CREATE",
        entity_table: "content",
        entity_id: String(newId),
        module: "Content",
        endpoint: `${req.method} ${req.originalUrl}`,
        description: `Created content id=${newId}`,
        before_data: null,
        after_data: after,
        changed_fields: diffObjects({}, after),
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return res.status(201).json({
      message: 'Content added successfully',
      id: newId,
      image: imagePath
    });
  } catch (error) {
    console.error('Error in addContent:', error);
    return res.status(500).json({ message: 'Failed to add content', error: error.message });
  }
};

// exports.addContent = async (req, res, next) => {
//   try {
//     console.log('BODY:', req.body);
//     console.log('FILES:', req.files || req.file);

//     const db = getConnection(process.env.DB_TYPE); // "mysql" or "postgres"

//     const {
//       name,
//       type,
//       display_status,
//       start_date,
//       end_date
//     } = req.body || {};

//     // ------------------------
//     // Basic validation
//     // ------------------------
//     if (!name || !type) {
//       return res.status(400).json({
//         message: 'Both "name" and "type" are required'
//       });
//     }

//     // ------------------------
//     // Image handling (store path to folder)
//     // ------------------------
//     const basePath = '/uploads/content_images/';
//     let imagePath = null;

//     // Support: upload.single('image')
//     if (req.file && req.file.filename) {
//       imagePath = basePath + req.file.filename;
//     }
//     // Support: upload.fields({ name: 'image', maxCount: 1 })
//     else if (req.files?.image?.[0]?.filename) {
//       imagePath = basePath + req.files.image[0].filename;
//     }
//     // Fallback: if front-end directly sends a string (URL/path)
//     else if (req.body.image) {
//       imagePath = req.body.image;
//     }

//     const status = 'ACTIVE'; // default value

//     const insertQuery = `
//       INSERT INTO content (
//         name,
//         type,
//         display_status,
//         image,
//         start_date,
//         end_date,
//         status
//       )
//       VALUES ($1, $2, $3, $4, $5, $6, $7)
//       RETURNING id
//     `;

//     const params = [
//       name,
//       type,
//       display_status || null,
//       imagePath,
//       start_date || null,
//       end_date || null,
//       status
//     ];

//     const result = await runQuery(db, insertQuery, params);

//     return res.status(201).json({
//       message: 'Content added successfully',
//       id: result?.[0]?.id,
//       image: imagePath
//     });
//   } catch (error) {
//     console.error('Error in addContent:', error);
//     return res.status(500).json({ message: 'Failed to add content', error: error.message });
//   }
// };


// ============================================================================
//                       Update Existing Content
// ============================================================================
// Expects multipart/form-data (same fields as add):
//   name, type, display_status, start_date, end_date
// Optional new file under "image" to replace existing image.
// If new image is sent, it:
//   - deletes the old file from disk
//   - updates the image column with the new path
// ============================================================================
exports.updateContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('UPDATE BODY:', req.body);
    console.log('UPDATE FILES:', req.files || req.file);

    const db = getConnection(process.env.DB_TYPE);

    // ✅ actor + metadata
    const { actorUserId, actorUsername } = await resolveActor(req, db);
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    // ✅ BEFORE snapshot
    const beforeRows = await runQuery(db, `SELECT * FROM content WHERE id = $1`, [id]);
    if (!beforeRows?.length) {
      return res.status(404).json({ message: 'Content not found' });
    }
    const before = beforeRows[0];

    let {
      name,
      type,
      display_status,
      start_date,
      end_date,
    } = req.body || {};

    if (!name || !type) {
      return res.status(400).json({
        message: 'Both "name" and "type" are required',
      });
    }

    // Small helper: normalize date string to "YYYY-MM-DD" or null
    const normalizeDate = (val) => {
      if (!val) return null;
      if (typeof val !== 'string') return val;
      const trimmed = val.trim();
      if (!trimmed) return null;
      // If "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss..." → keep first 10 chars
      return trimmed.slice(0, 10);
    };

    start_date = normalizeDate(start_date);
    end_date   = normalizeDate(end_date);

    // ------------------------
    // Image handling (optional)
    // ------------------------
    const basePath = '/uploads/content_images/';
    let imagePath = null;
    let hasNewImage = false;

    if (req.file && req.file.filename) {
      imagePath = basePath + req.file.filename;
      hasNewImage = true;
    } else if (req.files?.image?.[0]?.filename) {
      imagePath = basePath + req.files.image[0].filename;
      hasNewImage = true;
    } else if (req.body.image) {
      // if you allow front-end to explicitly send new URL/path
      imagePath = req.body.image;
      hasNewImage = true;
    }

    // If a new image is uploaded, delete the old one from disk
    if (hasNewImage) {
      try {
        // use BEFORE snapshot (no extra query needed)
        if (before?.image) {
          const currentImage = before.image; // e.g. "/uploads/content_images/xyz.jpg"
          const filename     = path.basename(currentImage);
          const absPath      = path.join(
            __dirname,
            '..',
            'uploads',
            'content_images',
            filename
          );
          safeUnlink(absPath);
        }
      } catch (err) {
        console.warn('Failed to delete old image on update:', err.message);
        // do NOT throw – we still want to update DB even if file deletion fails
      }
    }

    // Build dynamic UPDATE
    const setClauses = [];
    const values = [];
    let idx = 1;

    setClauses.push(`name = $${idx++}`);
    values.push(name);

    setClauses.push(`type = $${idx++}`);
    values.push(type);

    setClauses.push(`display_status = $${idx++}`);
    values.push(display_status || null);

    setClauses.push(`start_date = $${idx++}`);
    values.push(start_date);

    setClauses.push(`end_date = $${idx++}`);
    values.push(end_date);

    if (hasNewImage) {
      setClauses.push(`image = $${idx++}`);
      values.push(imagePath);
    }

    const updateQuery = `
      UPDATE content
      SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    values.push(id);

    const result = await runQuery(db, updateQuery, values);

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json({ message: 'Content not found or not updated' });
    }

    const after = result[0];

    // ✅ DIFF + AUDIT (only if changed)
    const changed_fields = diffObjects(before, after);
    if (changed_fields && Object.keys(changed_fields).length > 0) {
      await logAudit(db, {
        actor_user_id: actorUserId,
        actor_username: actorUsername,
        action: "UPDATE",
        entity_table: "content",
        entity_id: String(id),
        module: "Content",
        endpoint: `${req.method} ${req.originalUrl}`,
        description: `Updated content id=${id}`,
        before_data: before,
        after_data: after,
        changed_fields,
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return res.status(200).json({
      message: 'Content updated successfully',
      content: after,
    });
  } catch (error) {
    console.error('Error in updateContent:', error);
    return res
      .status(500)
      .json({ message: 'Failed to update content', error: error.message });
  }
};

// ============================================================================
//                       Delete Content Image
// ============================================================================
// DELETE /content/:id/image
// - Clears `image` column
// - Deletes the current file from /uploads/content_images
// ============================================================================
exports.deleteContentImage = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection(process.env.DB_TYPE);

    // 1. Get current image path
    const rows = await runQuery(
      db,
      'SELECT image FROM content WHERE id = $1',
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const currentImage = rows[0].image; // e.g. "/uploads/content_images/xyz.jpg"
    if (!currentImage) {
      return res.status(200).json({ message: 'No image to delete' });
    }

    // 2. Clear image column in DB
    await runQuery(
      db,
      'UPDATE content SET image = NULL WHERE id = $1',
      [id]
    );

    // 3. Delete physical file
    const filename = path.basename(currentImage);
    const absPath = path.join(__dirname, '..', 'uploads', 'content_images', filename);
    safeUnlink(absPath);

    return res.status(200).json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error in deleteContentImage:', err);
    return res.status(500).json({
      message: 'Failed to delete image',
      error: err.message,
    });
  }
};

// ============================================================================
//                       Soft Delete Content (status -> Inactive)
// ============================================================================
// DELETE /content/:id
// - Sets status = 'Inactive'
// - Does NOT touch the image (you still have deleteContentImage for that)
// ============================================================================
// exports.softDeleteContent = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const db = getConnection(process.env.DB_TYPE);

//     const result = await runQuery(
//       db,
//       "UPDATE content SET status = 'INACTIVE' WHERE id = $1 RETURNING *",
//       [id]
//     );

//     if (!result || result.length === 0) {
//       return res.status(404).json({ message: 'Content not found' });
//     }

//     return res.status(200).json({
//       message: 'Content status set to Inactive',
//       content: result[0],
//     });
//   } catch (err) {
//     console.error('Error in softDeleteContent:', err);
//     return res.status(500).json({
//       message: 'Failed to deactivate content',
//       error: err.message,
//     });
//   }
// };
exports.softDeleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection(process.env.DB_TYPE);

    // ✅ actor + metadata
    const { actorUserId, actorUsername } = await resolveActor(req, db);
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      null;
    const userAgent = req.headers["user-agent"] || null;

    // ✅ BEFORE snapshot
    const beforeRows = await runQuery(db, `SELECT * FROM content WHERE id = $1`, [id]);
    if (!beforeRows?.length) {
      return res.status(404).json({ message: "Content not found" });
    }
    const before = beforeRows[0];

    // ✅ UPDATE (soft delete)
    const result = await runQuery(
      db,
      "UPDATE content SET status = 'INACTIVE' WHERE id = $1 RETURNING *",
      [id]
    );

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "Content not found" });
    }

    const after = result[0];

    // ✅ AUDIT (only if changed)
    const changed_fields = diffObjects(before, after);
    if (changed_fields && Object.keys(changed_fields).length > 0) {
      await logAudit(db, {
        actor_user_id: actorUserId,
        actor_username: actorUsername,
        action: "DELETE", // or "UPDATE" if you prefer for soft delete
        entity_table: "content",
        entity_id: String(id),
        module: "Content",
        endpoint: `${req.method} ${req.originalUrl}`,
        description: `Soft-deleted content id=${id} (status=INACTIVE)`,
        before_data: before,
        after_data: after,
        changed_fields,
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return res.status(200).json({
      message: "Content status set to Inactive",
      content: after,
    });
  } catch (err) {
    console.error("Error in softDeleteContent:", err);
    return res.status(500).json({
      message: "Failed to deactivate content",
      error: err.message,
    });
  }
};