// controllers/obituaryController.js
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { buildObituaryHtml, THEME_CONFIG } = require('../utils/obituaryTemplates');

const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword, comparePassword } = require('../utils/hashUtils');

const OB_IMAGE_DIR = path.join(__dirname, '..', '..', 'uploads', 'obituary', 'images');
const OB_PDF_DIR   = path.join(__dirname, '..', '..', 'uploads', 'obituary', 'pdf');

const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
ensureDir(OB_IMAGE_DIR);
ensureDir(OB_PDF_DIR);

const sanitize = (name) =>
  name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '').toLowerCase();

const obituaryImageStorage = multer.diskStorage({
  destination: (req, file, cb) => { ensureDir(OB_IMAGE_DIR); cb(null, OB_IMAGE_DIR); },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${sanitize(file.originalname)}`),
});

const obituaryImageFilter = (req, file, cb) => {
  const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return ok.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only image files are allowed'), false);
};

exports.obituaryImageUpload = multer({
  storage: obituaryImageStorage,
  fileFilter: obituaryImageFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

/**
 * POST /api/obituary/upload-image
 */
exports.uploadObituaryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const filename = req.file.filename;
    return res.json({
      success: true,
      filename,
      url: `/api/uploads/obituary/images/${filename}`,
    });
  } catch (err) {
    console.error('uploadObituaryImage error:', err);
    return res.status(500).json({ success: false, message: 'Image upload failed' });
  }
};

/**
 * GET /api/obituary/by-memorial/:memorialId
 */
exports.getObituaryByMemorial = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { memorialId } = req.params;
    const query = `SELECT * FROM mt_obituary WHERE memorial_id = $1 AND is_active = true LIMIT 1`;
    const rows = await runQuery(db, query, [memorialId]);
    return res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('getObituaryByMemorial error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve obituary' });
  }
};

function pickObituaryFields(body) {
  return {
    md_content: body.md_content ?? null,
    mf_img: body.mf_img ?? null,
    mf_fullname: body.mf_fullname ?? null,
    mf_born: body.mf_born || null,
    mf_pass_date: body.mf_pass_date || null,
    'mf-born_location': body.mf_born_location ?? null,
    mf_pass_location: body.mf_pass_location ?? null,
    mf_quote: body.mf_quote ?? null,
    mf_wake_dtl_til: body.mf_wake_dtl_til ?? null,
    mf_wake_dtl_add: body.mf_wake_dtl_add ?? null,
    mf_cortehe_on: body.mf_cortehe_on || null,
    mf_location_funeral: body.mf_location_funeral ?? null,
    mf_further_dtl: body.mf_further_dtl ?? null,
    mf_further_dtl2: body.mf_further_dtl2 ?? null,
    mf_theme: body.mf_theme || 'd1',
  };
}

/**
 * POST /api/obituary/save
 */
exports.saveObituary = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const memorialId = req.body.memorialId;
    if (!memorialId) {
      return res.status(400).json({ success: false, message: 'memorialId is required' });
    }

    const fields = pickObituaryFields(req.body);
    const createBy = String(req.user.userId || '').slice(0, 10);

    const existing = await runQuery(
      db, `SELECT id FROM mt_obituary WHERE memorial_id = $1 AND is_active = true LIMIT 1`, [memorialId]
    );

    if (existing.length > 0) {
      const cols = Object.keys(fields);
      const setClause = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
      const values = cols.map((c) => fields[c]);
      values.push(memorialId);
      const updateSql = `UPDATE mt_obituary SET ${setClause} WHERE memorial_id = $${cols.length + 1} RETURNING *`;
      const rows = await runQuery(db, updateSql, values);
      return res.json({ success: true, data: rows[0], mode: 'updated' });
    }

    const insertFields = {
      ...fields,
      memorial_id: memorialId,
      number_list: memorialId,
      create_by: createBy,
      create_date: new Date().toISOString().slice(0, 10),
    };
    const cols = Object.keys(insertFields);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const quotedCols = cols.map((c) => `"${c}"`).join(', ');
    const values = cols.map((c) => insertFields[c]);
    const insertSql = `INSERT INTO mt_obituary (${quotedCols}) VALUES (${placeholders}) RETURNING *`;
    const rows = await runQuery(db, insertSql, values);
    return res.json({ success: true, data: rows[0], mode: 'created' });
  } catch (err) {
    console.error('saveObituary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save obituary' });
  }
};

/**
 * POST /api/obituary/generate-pdf/:memorialId
 */
exports.generateObituaryPdf = async (req, res) => {
  let browser;
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { memorialId } = req.params;

    const rows = await runQuery(
      db, `SELECT * FROM mt_obituary WHERE memorial_id = $1 AND is_active = true LIMIT 1`, [memorialId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Save the obituary before generating a PDF' });
    }
    const obituary = rows[0];

    const portraitAbsPath = obituary.mf_img
      ? path.join(OB_IMAGE_DIR, obituary.mf_img)
      : null;

    const html = buildObituaryHtml(obituary, { portraitAbsPath });

    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: 'PDF engine not installed. Run `npm install puppeteer` in the api folder.',
      });
    }

    const safeName = sanitize(obituary.mf_fullname || 'obituary');
    const pdfName = `${safeName}_obituary_${memorialId}.pdf`;
    const pdfPath = path.join(OB_PDF_DIR, pdfName);

    if (obituary.pdf_name && obituary.pdf_name !== pdfName) {
      const oldPath = path.join(OB_PDF_DIR, obituary.pdf_name);
      try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (_) {}
    }

    const orientation = (THEME_CONFIG[obituary.mf_theme] || THEME_CONFIG.d1).orientation;

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      landscape: orientation === 'landscape',
    });
    await browser.close();
    browser = null;

    await runQuery(
      db, `UPDATE mt_obituary SET pdf_name = $1 WHERE memorial_id = $2`, [pdfName, memorialId]
    );

    return res.json({
      success: true,
      pdfName,
      url: `/api/uploads/obituary/pdf/${pdfName}`,
    });
  } catch (err) {
    console.error('generateObituaryPdf error:', err);
    if (browser) { try { await browser.close(); } catch (_) {} }
    return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};

/**
 * GET /api/obituary/list
 */
exports.getObituary = async (req, res, next) => {
  try {
    const { fields } = req.body || {};
    let fieldList;

    if (Array.isArray(fields) && fields.length > 0) {
      fieldList = fields
        .map((f) => f.replace(/[^a-zA-Z0-9_\. ]/g, ''))
        .join(', ');
    }

    const defaultQuery = `SELECT * FROM mt_obituary WHERE is_active = true ORDER BY number_list::int ASC`;
    const queryWithCond = `SELECT ${fieldList} FROM mt_obituary WHERE is_active = true ORDER BY number_list::int ASC`;

    try {
      const db = getConnection(process.env.DB_TYPE);
      const query = fieldList ? queryWithCond : defaultQuery;
      const rows = await runQuery(db, query);
      return res.json(rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to retrieve results' });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/obituary/:id
 */
exports.getObituaryById = async (req, res, next) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { id } = req.params;

    const query = `SELECT * FROM mt_obituary WHERE id = $1 AND is_active = true LIMIT 1`;
    const rows = await runQuery(db, query, [id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Obituary not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getObituaryById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve obituary' });
  }
};

/**
 * DELETE /api/obituary/:id
 */
exports.deleteObituary = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { id } = req.params;
    const deletedBy = String(req.user.userId || '').slice(0, 10);

    const query = `
      UPDATE mt_obituary
      SET is_active = false, deleted_at = NOW(), deleted_by = $1
      WHERE id = $2 AND is_active = true
      RETURNING id
    `;
    const rows = await runQuery(db, query, [deletedBy, id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Obituary not found or already deleted' });
    }

    return res.json({ success: true, message: 'Obituary deleted' });
  } catch (err) {
    console.error('deleteObituary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete obituary' });
  }
};