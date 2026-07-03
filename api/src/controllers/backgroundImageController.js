const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { getConnection, runQuery } = require('../db/connectionManager');

// const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'background-images');
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads', 'background-images');

const DESKTOP_FOLDER = path.join(UPLOAD_ROOT, 'desktop');
const MOBILE_FOLDER = path.join(UPLOAD_ROOT, 'mobile');

const ensureDirectoryExists = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

ensureDirectoryExists(DESKTOP_FOLDER);
ensureDirectoryExists(MOBILE_FOLDER);

const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '')
    .toLowerCase();
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const status = Number(req.body.status);

    if (status === 1) {
      ensureDirectoryExists(DESKTOP_FOLDER);
      return cb(null, DESKTOP_FOLDER);
    }

    if (status === 2) {
      ensureDirectoryExists(MOBILE_FOLDER);
      return cb(null, MOBILE_FOLDER);
    }

    return cb(new Error('Invalid background image status'), null);
  },

  filename: (req, file, cb) => {
    const uniquePrefix = Date.now();
    const cleanName = sanitizeFileName(file.originalname);
    cb(null, `${uniquePrefix}-${cleanName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only image files are allowed'), false);
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB per image
  },
});

const uploadMiddleware = upload.array('images', 2);

const getBaseUrl = (req) => {
  return `${req.protocol}://${req.get('host')}`;
};

const getImageUrl = (req, item) => {
  const folder = Number(item.status) === 1 ? 'desktop' : 'mobile';
  return `${getBaseUrl(req)}/uploads/background-images/${folder}/${item.bg_image}`;
};

/**
 * GET /api/background-images
 */
const getBackgroundImages = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const sql = `
      SELECT
        id,
        bg_image,
        img_order,
        status
      FROM public.mt_bg_image
      WHERE status IN ('1', '2')
      ORDER BY 
        status ASC,
        CASE 
          WHEN img_order ~ '^[0-9]+$' THEN img_order::int 
          ELSE 999999 
        END ASC,
        id ASC
    `;

    const rows = await runQuery(db, sql);

    const data = rows.map((item) => ({
      ...item,
      status: Number(item.status),
      image_url: getImageUrl(req, item),
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getBackgroundImages error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch background images',
      error: error.message,
    });
  }
};

/**
 * POST /api/background-images/upload
 */
const uploadBackgroundImages = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const status = Number(req.body.status);
    const files = req.files || [];

    if (![1, 2].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use 1 for desktop or 2 for mobile.',
      });
    }

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image.',
      });
    }

    const countSql = `
        SELECT COUNT(*)::int AS total
        FROM public.mt_bg_image
        WHERE status = $1::varchar
    `;

    const countRows = await runQuery(db, countSql, [status]);
    const currentTotal = Number(countRows?.[0]?.total || 0);

    if (currentTotal + files.length > 2) {
      files.forEach((file) => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });

      return res.status(400).json({
        success: false,
        message: `Maximum 2 images allowed for ${
          status === 1 ? 'desktop' : 'mobile'
        }.`,
      });
    }

    const insertedRows = [];

    for (const file of files) {
      const insertSql = `
        INSERT INTO public.mt_bg_image (
          bg_image,
          status,
          img_order
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          bg_image,
          img_order,
          status
      `;

      const rows = await runQuery(db, insertSql, [
        file.filename,
        String(status),
        '',
      ]);

      insertedRows.push(rows[0]);
    }

    const data = insertedRows.map((item) => ({
      ...item,
      status: Number(item.status),
      image_url: getImageUrl(req, item),
    }));

    return res.status(201).json({
      success: true,
      message: 'Background image uploaded successfully',
      data,
    });
  } catch (error) {
    console.error('uploadBackgroundImages error:', error);

    if (req.files?.length) {
      req.files.forEach((file) => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to upload background image',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/background-images/:id
 */
const updateBackgroundImage = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;
  const { img_order } = req.body;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Image ID is required',
      });
    }

    const updateSql = `
      UPDATE public.mt_bg_image
      SET img_order = $1
      WHERE id = $2
      RETURNING
        id,
        bg_image,
        img_order,
        status
    `;

    const rows = await runQuery(db, updateSql, [
      img_order === undefined || img_order === null ? '' : String(img_order),
      id,
    ]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Background image not found',
      });
    }

    const item = rows[0];

    return res.status(200).json({
      success: true,
      message: 'Background image order updated successfully',
      data: {
        ...item,
        status: Number(item.status),
        image_url: getImageUrl(req, item),
      },
    });
  } catch (error) {
    console.error('updateBackgroundImage error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update background image',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/background-images/:id
 */
const deleteBackgroundImage = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  try {
    const findSql = `
      SELECT
        id,
        bg_image,
        status
      FROM public.mt_bg_image
      WHERE id = $1
      LIMIT 1
    `;

    const findRows = await runQuery(db, findSql, [id]);

    if (!findRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Background image not found',
      });
    }

    const image = findRows[0];

    const deleteSql = `
      DELETE FROM public.mt_bg_image
      WHERE id = $1
      RETURNING id
    `;

    await runQuery(db, deleteSql, [id]);

    const folder = Number(image.status) === 1 ? DESKTOP_FOLDER : MOBILE_FOLDER;
    const filePath = path.join(folder, image.bg_image);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({
      success: true,
      message: 'Background image deleted successfully',
    });
  } catch (error) {
    console.error('deleteBackgroundImage error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete background image',
      error: error.message,
    });
  }
};

module.exports = {
  uploadMiddleware,
  getBackgroundImages,
  uploadBackgroundImages,
  updateBackgroundImage,
  deleteBackgroundImage,
};