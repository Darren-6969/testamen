// src/controllers/photoAlbumController.js
// Photos & Albums tab.
//  - Backgrounds: mt_memorial_background (soft delete, is_active).
//  - Albums:      mt_album  (MAX(id)+1, pre-existing table).
//  - Photos:      mt_photo  (IDENTITY). Photos are soft-deleted (deleted_at).
//  - Membership:  mt_album_photo (many-to-many). A photo can be in many albums
//                 and always stays visible in the Photos section.

const { getConnection, runQuery } = require('../db/connectionManager');
const { ownsMemorial, cleanupFiles } = require('../utils/adminHelpers');
const { mediaUrl } = require('../utils/memorialUpload');

const uploader = (req) => String(req.user?.userId || req.user?.codeNo || '').slice(0, 100);

// =============================== BACKGROUNDS ===============================
exports.listBackgrounds = async (req, res) => {
  try {
    const { memorialId } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ message: 'Not your memorial' });
    const rows = await runQuery(
      db,
      `SELECT id, filename, file_size, is_active, created_by, created_date
       FROM mt_memorial_background
       WHERE memorial_id = $1 AND deleted_at IS NULL ORDER BY id DESC`,
      [String(memorialId)]
    );
    return res.json(
      (rows || []).map((r) => ({
        id: String(r.id),
        url: mediaUrl('backgrounds', r.filename),
        sizeBytes: Number(r.file_size) || 0,
        isActive: r.is_active,
        createdBy: r.created_by,
        createdAt: r.created_date,
      }))
    );
  } catch (err) {
    console.error('listBackgrounds error:', err);
    return res.status(500).json({ message: 'Failed to load backgrounds' });
  }
};

exports.uploadBackgrounds = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const memorialId = req.body.memorialId;
    const files = req.files || [];
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo))) {
      cleanupFiles(files);
      return res.status(403).json({ status: 'error', message: 'Not your memorial' });
    }
    const activeRow = await runQuery(
      db,
      `SELECT COUNT(*)::int AS c FROM mt_memorial_background
       WHERE memorial_id = $1 AND is_active = true AND deleted_at IS NULL`,
      [String(memorialId)]
    );
    let hasActive = Number(activeRow[0].c) > 0;
    for (const f of files) {
      const makeActive = !hasActive;
      hasActive = true;
      await runQuery(
        db,
        `INSERT INTO mt_memorial_background (memorial_id, filename, file_size, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [String(memorialId), f.filename, f.size, makeActive, uploader(req)]
      );
    }
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('uploadBackgrounds error:', err);
    cleanupFiles(req.files);
    return res.status(500).json({ status: 'error', message: 'Upload failed' });
  }
};

exports.setActiveBackground = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const { id } = req.params;
    const own = await runQuery(
      db,
      `SELECT b.memorial_id FROM mt_memorial_background b
       JOIN mt_deceased d ON d.number_list = b.memorial_id
       WHERE b.id = $1 AND d.code_no = $2 LIMIT 1`,
      [id, req.user?.codeNo]
    );
    if (!own.length) return res.status(404).json({ status: 'error', message: 'Not found' });
    await runQuery(
      db,
      `UPDATE mt_memorial_background SET is_active = (id = $1)
       WHERE memorial_id = $2 AND deleted_at IS NULL`,
      [id, own[0].memorial_id]
    );
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('setActiveBackground error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed' });
  }
};

exports.deleteBackground = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const { id } = req.params;
    const rows = await runQuery(
      db,
      `UPDATE mt_memorial_background b
       SET deleted_at = now(), is_active = false
       FROM mt_deceased d
       WHERE b.id = $1 AND b.memorial_id = d.number_list AND d.code_no = $2 AND b.deleted_at IS NULL
       RETURNING b.id`,
      [id, req.user?.codeNo]
    );
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Not found' });
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('deleteBackground error:', err);
    return res.status(500).json({ status: 'error', message: 'Delete failed' });
  }
};

// ================================= ALBUMS =================================
exports.listAlbums = async (req, res) => {
  try {
    const { memorialId } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ message: 'Not your memorial' });
    const rows = await runQuery(
      db,
      `SELECT a.id, a.mf_album_title, a.mf_desc, a.mf_location,
              (SELECT COUNT(*)::int
                 FROM mt_album_photo ap JOIN mt_photo p ON p.id = ap.photo_id
                 WHERE ap.album_id = a.id AND p.deleted_at IS NULL) AS photo_count,
              (SELECT p.filename
                 FROM mt_album_photo ap JOIN mt_photo p ON p.id = ap.photo_id
                 WHERE ap.album_id = a.id AND p.deleted_at IS NULL
                 ORDER BY p.id DESC LIMIT 1) AS cover
       FROM mt_album a
       WHERE a.memorial_id = $1 ORDER BY a.id DESC`,
      [String(memorialId)]
    );
    return res.json(
      (rows || []).map((r) => ({
        id: String(r.id),
        title: r.mf_album_title || 'Untitled',
        description: r.mf_desc || '',
        location: r.mf_location || '',
        cover: r.cover ? mediaUrl('photos', r.cover) : null,
        photoCount: Number(r.photo_count || 0),
      }))
    );
  } catch (err) {
    console.error('listAlbums error:', err);
    return res.status(500).json({ message: 'Failed to load albums' });
  }
};

exports.createAlbum = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const { memorialId, title, description, location } = req.body;
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ status: 'error', message: 'Not your memorial' });
    if (!title) return res.status(400).json({ status: 'error', message: 'Title required' });
    const nextId = (await runQuery(db, `SELECT COALESCE(MAX(id),0)+1 AS n FROM mt_album`))[0].n;
    await runQuery(
      db,
      `INSERT INTO mt_album
         (id, mf_album_title, mf_desc, mf_location, mf_create_by, mf_create_date, mf_create_time, memorial_id)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, now(), $6)`,
      [nextId, title, description || null, location || null, uploader(req), String(memorialId)]
    );
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('createAlbum error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to create album' });
  }
};

exports.updateAlbum = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const { id } = req.params;
    const { title, description, location } = req.body;
    if (!title) return res.status(400).json({ status: 'error', message: 'Title required' });
    const rows = await runQuery(
      db,
      `UPDATE mt_album a
       SET mf_album_title = $1, mf_desc = $2, mf_location = $3
       FROM mt_deceased d
       WHERE a.id = $4 AND a.memorial_id = d.number_list AND d.code_no = $5
       RETURNING a.id`,
      [title, description || null, location || null, id, req.user?.codeNo]
    );
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Album not found' });
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('updateAlbum error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to update album' });
  }
};

// add existing photos to an album (link only -- photos stay in Photos section)
exports.addPhotosToAlbum = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const { memorialId, albumId, photoIds } = req.body;
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ status: 'error', message: 'Not your memorial' });
    const alb = await runQuery(
      db,
      `SELECT 1 FROM mt_album WHERE id = $1 AND memorial_id = $2 LIMIT 1`,
      [albumId, String(memorialId)]
    );
    if (!alb.length) return res.status(404).json({ status: 'error', message: 'Album not found' });
    const ids = (Array.isArray(photoIds) ? photoIds : [])
      .map((x) => parseInt(x, 10))
      .filter(Number.isFinite);
    if (!ids.length) return res.status(400).json({ status: 'error', message: 'No photos selected' });

    for (const pid of ids) {
      await runQuery(
        db,
        `INSERT INTO mt_album_photo (album_id, photo_id)
         SELECT $1, $2
         WHERE EXISTS (SELECT 1 FROM mt_photo WHERE id = $2 AND memorial_id = $3 AND deleted_at IS NULL)
         ON CONFLICT (album_id, photo_id) DO NOTHING`,
        [albumId, pid, String(memorialId)]
      );
    }
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('addPhotosToAlbum error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to add photos' });
  }
};

// remove photos from an album (unlink only -- photos remain in Photos section)
exports.removePhotosFromAlbum = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const { memorialId, albumId, photoIds } = req.body;
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ status: 'error', message: 'Not your memorial' });
    const ids = (Array.isArray(photoIds) ? photoIds : [])
      .map((x) => parseInt(x, 10))
      .filter(Number.isFinite);
    if (!ids.length) return res.status(400).json({ status: 'error', message: 'No photos selected' });
    await runQuery(
      db,
      `DELETE FROM mt_album_photo WHERE album_id = $1 AND photo_id = ANY($2::int[])`,
      [albumId, ids]
    );
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('removePhotosFromAlbum error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to remove photos' });
  }
};

// ================================= PHOTOS =================================
// no albumId -> ALL photos for the memorial; ?albumId=X -> photos linked to X
exports.listPhotos = async (req, res) => {
  try {
    const { memorialId } = req.params;
    const { albumId } = req.query;
    const db = getConnection(process.env.DB_TYPE);
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ message: 'Not your memorial' });

    let rows;
    if (albumId) {
      rows = await runQuery(
        db,
        `SELECT p.id, p.filename, p.file_size, p.description, p.created_at
         FROM mt_photo p
         JOIN mt_album_photo ap ON ap.photo_id = p.id
         WHERE ap.album_id = $2 AND p.memorial_id = $1
           AND p.deleted_at IS NULL AND p.approval_status = 'approved'
         ORDER BY p.id DESC`,
        [String(memorialId), albumId]
      );
    } else {
      rows = await runQuery(
        db,
        `SELECT id, filename, file_size, description, created_at
         FROM mt_photo
         WHERE memorial_id = $1 AND deleted_at IS NULL AND approval_status = 'approved'
         ORDER BY id DESC`,
        [String(memorialId)]
      );
    }
    return res.json(
      (rows || []).map((r) => ({
        id: String(r.id),
        url: mediaUrl('photos', r.filename),
        sizeBytes: Number(r.file_size) || 0,
        caption: r.description || '',
        createdAt: r.created_at,
      }))
    );
  } catch (err) {
    console.error('listPhotos error:', err);
    return res.status(500).json({ message: 'Failed to load photos' });
  }
};

exports.uploadPhotos = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const memorialId = req.body.memorialId;
    const albumId = req.body.albumId || null;
    const files = req.files || [];
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo))) {
      cleanupFiles(files);
      return res.status(403).json({ status: 'error', message: 'Not your memorial' });
    }
    for (const f of files) {
      const inserted = await runQuery(
        db,
        `INSERT INTO mt_photo (memorial_id, filename, file_size, uploaded_by, approval_status)
         VALUES ($1, $2, $3, $4, 'approved') RETURNING id`,
        [String(memorialId), f.filename, f.size, uploader(req)]
      );
      if (albumId) {
        await runQuery(
          db,
          `INSERT INTO mt_album_photo (album_id, photo_id) VALUES ($1, $2)
           ON CONFLICT (album_id, photo_id) DO NOTHING`,
          [albumId, inserted[0].id]
        );
      }
    }
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('uploadPhotos error:', err);
    cleanupFiles(req.files);
    return res.status(500).json({ status: 'error', message: 'Upload failed' });
  }
};

// HARD delete: remove album links, the row, and the file on disk.
exports.deletePhoto = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const { id } = req.params;
    const rows = await runQuery(
      db,
      `SELECT p.filename FROM mt_photo p
       JOIN mt_deceased d ON d.number_list = p.memorial_id
       WHERE p.id = $1 AND d.code_no = $2 LIMIT 1`,
      [id, req.user?.codeNo]
    );
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Not found' });
    // Soft delete: keep the row + file on disk so it can be restored. Album links
    // in mt_album_photo are left intact — every read path already filters
    // deleted_at IS NULL (listPhotos, album photo_count, cover-photo), so the
    // photo drops out of all listings and counts automatically, and its album
    // membership is preserved if it's ever restored. storageController also sums
    // file_size only WHERE deleted_at IS NULL, so it stops counting against quota.
    await runQuery(
      db,
      `UPDATE mt_photo SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('deletePhoto error:', err);
    return res.status(500).json({ status: 'error', message: 'Delete failed' });
  }
};