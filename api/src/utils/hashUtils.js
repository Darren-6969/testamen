// src/utils/hashUtils.js
const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// ---------------------------------------------------------------------------
// Legacy password support (mt_user_account only)
//
// The legacy PHP app left mt_user_account with two password formats:
//
//   1. bcrypt, PHP-flavoured: "$2y$10$..."
//      bcrypt@6 does NOT understand the $2y$ prefix. It does not throw —
//      it silently returns false, so these accounts look like a wrong password.
//      $2y$ and $2b$ are the same algorithm; only the prefix differs, so
//      rewriting the prefix makes it verify correctly.
//
//   2. base64-encoded plaintext: "MDMwNjk2" === base64("030696")
//      No hashing at all. Compared by encoding the input, never by decoding
//      the stored value.
//
// Use compareLegacyPassword ONLY for mt_user_account. Staff (`users`) rows are
// hashed by this app with bcrypt and must keep using comparePassword.
// ---------------------------------------------------------------------------

const isBcryptHash = (hash) => /^\$2[aby]\$/.test(hash || '');

const compareLegacyPassword = async (password, hash) => {
    if (!password || !hash) return false;

    if (isBcryptHash(hash)) {
        const normalised = hash.replace(/^\$2y\$/, '$2b$');
        try {
            return await bcrypt.compare(password, normalised);
        } catch (err) {
            return false;
        }
    }

    // base64-encoded plaintext
    try {
        return Buffer.from(String(password), 'utf8').toString('base64') === hash;
    } catch (err) {
        return false;
    }
};

module.exports = {
    hashPassword,
    comparePassword,
    compareLegacyPassword,
    isBcryptHash,
};