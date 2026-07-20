// src/controllers/customerSettingController.js
//
// Customer dashboard settings. Operates ONLY on mt_user_account.
//
// Do not confuse with settingController.js, which is the staff equivalent and
// operates on users/staff. They are distinct tables that share an id space —
// mixing them means account 46 in one table silently overwrites account 46 in
// the other. Every handler here is guarded by portal === 'customer'.
//
// Identity always comes from the JWT (req.user.userId === mt_user_account.id).

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword, compareLegacyPassword } = require('../utils/hashUtils');

const currentUserId = (req) => req.user?.userId ?? null;

// ================= AVATAR STORAGE =================
//
// Avatars live in uploads/users and are served by the '/api/uploads/users'
// static mount in index.js, mirroring the obituary pattern.

const AVATAR_DIR = path.join(__dirname, '..', '..', 'uploads', 'users');

const ensureDir = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};
ensureDir(AVATAR_DIR);

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(AVATAR_DIR);
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    // One file per user, replaced on each upload (see uploadMyPicture), so the
    // timestamp exists purely to bust browser/CDN caches.
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, `user-${currentUserId(req)}-${Date.now()}${ext}`);
  },
});

const avatarFilter = (req, file, cb) => {
  const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return ok.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only JPG, PNG or WEBP images are allowed'), false);
};

// Exported so the route can use it as middleware: avatarUpload.single('picture')
exports.avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

/**
 * mt_user_account.picture holds either:
 *   - a filename we wrote        -> serve from the static mount
 *   - an absolute URL            -> legacy Facebook OAuth avatar; use as-is
 *     (the picture/oauth_uid/first_name/last_name/gender/locale/link column set
 *      is the Facebook Graph user object. No row currently has one, but the
 *      shape is honoured so reviving social login needs no change here.)
 */
const resolvePictureUrl = (picture) => {
  if (!picture) return null;
  if (/^https?:\/\//i.test(picture)) return picture;
  return `/api/uploads/users/${picture}`;
};

/** Delete a previously uploaded avatar, ignoring OAuth URLs and missing files. */
const removeAvatarFile = (picture) => {
  if (!picture || /^https?:\/\//i.test(picture)) return;
  try {
    // basename() so a crafted value can never escape AVATAR_DIR.
    const target = path.join(AVATAR_DIR, path.basename(picture));
    if (fs.existsSync(target)) fs.unlinkSync(target);
  } catch (err) {
    // A stale file left on disk is not worth failing the request over.
    console.error('removeAvatarFile error:', err);
  }
};

// ================= PROFILE =================

exports.getMyProfile = async (req, res) => {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

    const db = getConnection(process.env.DB_TYPE);

    // feature_id is varchar(20) while mt_feature.id is integer -> cast to text.
    // A null feature_id means the account has never bought a plan => Free.
    const query = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.phone_number,
        u.country_code,
        u.referral_code,
        u.referral_bonus_mb,
        u.feature_id,
        u.code_no,
        u.picture,
        u.status,
        u.verification_status,
        COALESCE(f.feature_plan, 'Free')  AS plan_name,
        COALESCE(f.storage_mb, '50')      AS plan_storage_mb
      FROM mt_user_account u
      LEFT JOIN mt_feature f ON f.id::text = u.feature_id
      WHERE u.id = $1
      LIMIT 1
    `;

    const rows = await runQuery(db, query, [userId]);
    if (!rows?.length) return res.status(404).json({ message: 'Profile not found' });

    const profile = rows[0];
    return res.json({
      ...profile,
      picture_url: resolvePictureUrl(profile.picture),
    });
  } catch (err) {
    console.error('getMyProfile (customer) error:', err);
    return res.status(500).json({ message: 'Server error loading profile' });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

    // Only these two are editable. email is the login identifier and is
    // deliberately not accepted here; referral_code is system-generated;
    // picture has its own endpoint.
    const { username, phone_number } = req.body || {};

    const name = String(username || '').trim();
    const phone = String(phone_number || '').trim();

    if (!name) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (name.length > 255) {
      return res.status(400).json({ message: 'Full name is too long' });
    }
    if (phone && phone.length > 20) {
      return res.status(400).json({ message: 'Phone number is too long' });
    }

    const db = getConnection(process.env.DB_TYPE);

    const sql = `
      UPDATE mt_user_account
         SET username     = $1,
             phone_number = $2,
             modified     = CURRENT_DATE
       WHERE id = $3
    `;
    await runQuery(db, sql, [name, phone || null, userId]);

    return res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('updateMyProfile (customer) error:', err);
    return res.status(500).json({ message: 'Server error updating profile' });
  }
};

// ================= PROFILE PICTURE =================

/**
 * POST /api/customer-setting/profile/picture
 * multipart/form-data, field name: "picture"
 */
exports.uploadMyPicture = async (req, res) => {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' });
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const db = getConnection(process.env.DB_TYPE);

    // Grab the old value first so the replaced file can be cleaned up.
    const existing = await runQuery(
      db,
      'SELECT picture FROM mt_user_account WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (!existing?.length) {
      removeAvatarFile(req.file.filename);
      return res.status(404).json({ message: 'Profile not found' });
    }

    const filename = req.file.filename;

    await runQuery(
      db,
      'UPDATE mt_user_account SET picture = $1, modified = CURRENT_DATE WHERE id = $2',
      [filename, userId]
    );

    // Only after the DB commits, so a failed update never orphans the new file.
    removeAvatarFile(existing[0].picture);

    return res.json({
      success: true,
      message: 'Profile picture updated',
      picture: filename,
      picture_url: resolvePictureUrl(filename),
    });
  } catch (err) {
    console.error('uploadMyPicture error:', err);
    if (req.file) removeAvatarFile(req.file.filename);
    return res.status(500).json({ message: 'Profile picture upload failed' });
  }
};

/** DELETE /api/customer-setting/profile/picture */
exports.deleteMyPicture = async (req, res) => {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

    const db = getConnection(process.env.DB_TYPE);

    const existing = await runQuery(
      db,
      'SELECT picture FROM mt_user_account WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (!existing?.length) return res.status(404).json({ message: 'Profile not found' });

    await runQuery(
      db,
      'UPDATE mt_user_account SET picture = NULL, modified = CURRENT_DATE WHERE id = $1',
      [userId]
    );

    removeAvatarFile(existing[0].picture);

    return res.json({ success: true, message: 'Profile picture removed' });
  } catch (err) {
    console.error('deleteMyPicture error:', err);
    return res.status(500).json({ message: 'Failed to remove profile picture' });
  }
};

// ================= PASSWORD =================

exports.updateMyPassword = async (req, res) => {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from the current password' });
    }

    const db = getConnection(process.env.DB_TYPE);

    const rows = await runQuery(
      db,
      'SELECT password FROM mt_user_account WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (!rows?.length) return res.status(404).json({ message: 'Profile not found' });

    // Accepts both legacy formats ($2y$ bcrypt and base64 plaintext).
    const match = await compareLegacyPassword(currentPassword, rows[0].password);
    if (!match) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Always write a modern bcrypt hash. Changing the password therefore
    // migrates legacy accounts off $2y$/base64 one user at a time.
    const newHash = await hashPassword(newPassword);

    await runQuery(
      db,
      'UPDATE mt_user_account SET password = $1, modified = CURRENT_DATE WHERE id = $2',
      [newHash, userId]
    );

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('updateMyPassword (customer) error:', err);
    return res.status(500).json({ message: 'Server error updating password' });
  }
};