// src/controllers/registerMediaController.js
// Landing page -> Register module -> Step 2 "Select a template".
//
// The registration form writes nothing until Step 3, so an abandoned form leaves
// no half-built account behind. That creates one wrinkle for the profile
// picture: it is chosen at Step 2, but the mt_profile row it belongs to does not
// exist yet.
//
// Resolution: the file is uploaded and stored straight away, and only the
// returned FILENAME travels in the form state. At commit, that filename is
// written to mt_profile.profile_pic - exactly the value shape the admin module
// already stores there. Nothing about the file moves or is copied afterwards.
//
// Limits are inherited, not redefined: this reuses profilePicUpload from
// utils/memorialUpload, so the public funnel and the authenticated admin route
// accept precisely the same thing - one image, 8 MB, jpeg/jpg/png/webp/gif,
// landing in uploads/memorial/profile/ and served from
// /api/uploads/memorial/profile/<filename>. Profile pictures are excluded from
// the storage quota, so no quota middleware is in the chain (the uploader falls
// back to its configured 8 MB cap when req.storageQuota is absent).
//
// TWO THINGS WORTH KNOWING:
//
// 1. ORPHANS. Upload at Step 2, abandon the form, and the file sits on disk with
//    no mt_profile row pointing at it. Orphans are findable by comparing the
//    profile folder against mt_profile.profile_pic; a periodic sweep is worth
//    adding once this flow is live.
//
// 2. THIS ENDPOINT IS UNAUTHENTICATED, because it sits ahead of account
//    creation - inherent to a public funnel, but it does mean anyone can put
//    bytes on disk. The mime filter, single-file limit and size cap bound the
//    damage. Per-IP rate limiting is the missing piece and should be added
//    before this is exposed publicly.

const { mediaUrl } = require('../utils/memorialUpload');
const { cleanupFiles } = require('../utils/adminHelpers');

/**
 * POST /api/registration/profile-photo   (multipart, field name: "files")
 *
 * 200 -> { status, filename, url, size }
 *   filename  what to send back at Step 3; becomes mt_profile.profile_pic
 *   url       ready-to-render preview path
 *
 * Size, type and count rejections are handled upstream by profilePicUpload,
 * which responds 400/413 with its own message before reaching this handler.
 */
exports.stageProfilePhoto = async (req, res) => {
  try {
    const file = (req.files || [])[0];

    if (!file) {
      return res.status(400).json({ status: 'error', message: 'No file received.' });
    }

    return res.json({
      status: 'success',
      filename: file.filename,
      url: mediaUrl('profile', file.filename),
      size: file.size,
    });
  } catch (err) {
    console.error('stageProfilePhoto error:', err);
    cleanupFiles(req.files);
    return res.status(500).json({ status: 'error', message: 'Upload failed.' });
  }
};