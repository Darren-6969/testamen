// src/controllers/adminProfileController.js
// Customer Dashboard -> Admin Module -> Main Page tab: mt_profile (upsert by memorial_id, manual id since no sequence)
// + profile picture upload + cemetery images (mt_cemetary_image, max 3).

const { getConnection, runQuery } = require('../db/connectionManager');
const { ownsMemorial, cleanupFiles } = require('../utils/adminHelpers');
const { mediaUrl, diskPath } = require('../utils/memorialUpload');
const fs = require('fs');

const nz = (v) => (v === undefined || v === null || v === '' ? null : String(v));

// payload key -> mt_profile column
const COLS = {
  fullname: 'fullname',
  gender: 'gender',
  career: 'career',
  bornDate: 'born',
  placeBirth: 'place_birth',
  passedDate: 'pass_date',
  placePassing: 'pass_location',
  causeDeath: 'cause_death',
  favQuote: 'quote',
  story: 'story',
  myExpression: 'expression',
  ourStory: 'our_story',
  address: 'location',
  postcode: 'postal_code',
  city: 'city',
  state: 'state',
  country: 'country',
  lat: 'lat',
  lon: 'lon',
  themeId: 'theme',
  music: 'music',
  privacy: 'privacy',
};

exports.getProfile = async (req, res) => {
  try {
    const { memorialId } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ message: 'Not your memorial' });

    const rows = await runQuery(
      db,
      `SELECT fullname, gender, career,
              to_char(born, 'YYYY-MM-DD') AS born, place_birth,
              to_char(pass_date, 'YYYY-MM-DD') AS pass_date, pass_location, cause_death,
              quote, story, expression, our_story, profile_pic,
              location, postal_code, city, state, country, lat, lon,
              theme, music, privacy
       FROM mt_profile WHERE memorial_id = $1 LIMIT 1`,
      [String(memorialId)]
    );
    const r = rows?.[0] || {};
    const d = (v) => (v ? String(v).slice(0, 10) : ''); // date -> YYYY-MM-DD

    // The card/dashboard display name lives on mt_deceased, not mt_profile.
    // Read it here so the Main Page form can edit it alongside the full name.
    const decRows = await runQuery(
      db,
      `SELECT memorial_name FROM mt_deceased WHERE number_list = $1 LIMIT 1`,
      [String(memorialId)]
    );

    return res.json({
      profilePic: r.profile_pic ? mediaUrl('profile', r.profile_pic) : null,
      memorialName: decRows?.[0]?.memorial_name || '',
      fullname: r.fullname || '',
      gender: r.gender || '',
      career: r.career || '',
      bornDate: d(r.born),
      placeBirth: r.place_birth || '',
      passedDate: d(r.pass_date),
      placePassing: r.pass_location || '',
      causeDeath: r.cause_death || '',
      favQuote: r.quote || '',
      story: r.story || '',
      myExpression: r.expression || '',
      ourStory: r.our_story || '',
      address: r.location || '',
      postcode: r.postal_code || '',
      city: r.city || '',
      state: r.state || '',
      country: r.country || 'Malaysia',
      lat: r.lat || '',
      lon: r.lon || '',
      themeId: r.theme || '1',
      music: r.music || '',
      privacy: r.privacy === 'Private' ? 'Private' : 'Public',
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ message: 'Failed to load profile' });
  }
};

exports.saveProfile = async (req, res) => {
  try {
    const memorialId = req.body.memorialId;
    const db = getConnection(process.env.DB_TYPE);
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ status: 'error', message: 'Not your memorial' });

    const keys = Object.keys(COLS);
    const cols = keys.map((k) => COLS[k]);
    const isoDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : null);
    const vals = keys.map((k) =>
      k === 'bornDate' || k === 'passedDate' ? isoDate(req.body[k]) : nz(req.body[k])
    );

    const existing = await runQuery(
      db,
      `SELECT id FROM mt_profile WHERE memorial_id = $1 LIMIT 1`,
      [String(memorialId)]
    );

    if (existing.length) {
      const accId = String(req.user?.userId || '').slice(0, 10) || null;
      const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
      await runQuery(
        db,
        `UPDATE mt_profile SET ${setClause},
                acc_id = COALESCE(NULLIF(acc_id, ''), $${cols.length + 1}),
                last_modified_date = CURRENT_DATE
         WHERE memorial_id = $${cols.length + 2}`,
        [...vals, accId, String(memorialId)]
      );
    } else {
      const nextId = (
        await runQuery(db, `SELECT COALESCE(MAX(id),0)+1 AS n FROM mt_profile`)
      )[0].n;
      // acc_id = mt_user_account.id (the creator) = JWT userId; set only on creation
      const accId = String(req.user?.userId || '').slice(0, 10) || null;
      const insertCols = ['id', 'acc_id', 'code_no', 'memorial_id', ...cols];
      const insertParams = [nextId, accId, req.user?.codeNo || null, String(memorialId), ...vals];
      const placeholders = insertParams.map((_, i) => `$${i + 1}`).join(', ');
      await runQuery(
        db,
        `INSERT INTO mt_profile (${insertCols.join(', ')}, last_modified_date)
         VALUES (${placeholders}, CURRENT_DATE)`,
        insertParams
      );
    }
    // Display name shown on the dashboard rail and memorial cards. Stored on
    // mt_deceased (NOT mt_profile). Falls back to the full name when the user
    // leaves it blank, so the two stay the same by default; set it explicitly
    // to use a nickname or preferred name. url_name is deliberately NOT touched
    // here — public URLs stay stable across a rename.
    const memorialName =
      String(req.body.memorialName || '').trim() ||
      String(req.body.fullname || '').trim();
    if (memorialName) {
      await runQuery(
        db,
        `UPDATE mt_deceased SET memorial_name = $1 WHERE number_list = $2`,
        [memorialName, String(memorialId)]
      );
    }

    return res.json({ status: 'success' });
  } catch (err) {
    console.error('saveProfile error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to save profile' });
  }
};

exports.uploadProfilePic = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const memorialId = req.body.memorialId;
    const file = (req.files || [])[0];
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo))) {
      cleanupFiles(req.files);
      return res.status(403).json({ status: 'error', message: 'Not your memorial' });
    }
    if (!file) return res.status(400).json({ status: 'error', message: 'No file' });

    await runQuery(db, `UPDATE mt_profile SET profile_pic = $1 WHERE memorial_id = $2`, [
      file.filename,
      String(memorialId),
    ]);
    return res.json({ status: 'success', url: mediaUrl('profile', file.filename) });
  } catch (err) {
    console.error('uploadProfilePic error:', err);
    cleanupFiles(req.files);
    return res.status(500).json({ status: 'error', message: 'Upload failed' });
  }
};

// --------------------------- cemetery images ---------------------------
exports.listCemetery = async (req, res) => {
  try {
    const { memorialId } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ message: 'Not your memorial' });
    const rows = await runQuery(
      db,
      `SELECT id, image_name FROM mt_cemetary_image WHERE memorial_id = $1 ORDER BY id ASC`,
      [String(memorialId)]
    );
    return res.json(
      (rows || []).map((r) => ({ id: String(r.id), url: mediaUrl('cemetery', r.image_name) }))
    );
  } catch (err) {
    console.error('listCemetery error:', err);
    return res.status(500).json({ message: 'Failed to load cemetery images' });
  }
};

exports.uploadCemetery = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const memorialId = req.body.memorialId;
    const files = req.files || [];
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo))) {
      cleanupFiles(files);
      return res.status(403).json({ status: 'error', message: 'Not your memorial' });
    }
    const countRow = await runQuery(
      db,
      `SELECT COUNT(*)::int AS c FROM mt_cemetary_image WHERE memorial_id = $1`,
      [String(memorialId)]
    );
    if (Number(countRow[0].c) + files.length > 3) {
      cleanupFiles(files);
      return res.status(400).json({ status: 'error', message: 'Max 3 cemetery images' });
    }
    for (const f of files) {
      const nextId = (
        await runQuery(db, `SELECT COALESCE(MAX(id),0)+1 AS n FROM mt_cemetary_image`)
      )[0].n;
      await runQuery(
        db,
        `INSERT INTO mt_cemetary_image (id, image_name, image_size, image_type, memorial_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [nextId, f.filename, String(f.size), f.mimetype, String(memorialId)]
      );
    }
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('uploadCemetery error:', err);
    cleanupFiles(req.files);
    return res.status(500).json({ status: 'error', message: 'Upload failed' });
  }
};

exports.deleteCemetery = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const { id } = req.params;
    const rows = await runQuery(
      db,
      `SELECT c.image_name FROM mt_cemetary_image c
       JOIN mt_deceased d ON d.number_list = c.memorial_id
       WHERE c.id = $1 AND d.code_no = $2 LIMIT 1`,
      [id, req.user?.codeNo]
    );
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Not found' });
    await runQuery(db, `DELETE FROM mt_cemetary_image WHERE id = $1`, [id]);
    const p = diskPath('cemetery', rows[0].image_name);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('deleteCemetery error:', err);
    return res.status(500).json({ status: 'error', message: 'Delete failed' });
  }
};