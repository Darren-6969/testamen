const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  let token = null;

  // ✅ 1. Check HTTP-only cookie
  if (req.cookies) {
    token = req.cookies.token || req.cookies.access_token || req.cookies.auth_token || null;
  }

  // ✅ 2. If no cookie, check Authorization header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // ❌ No token found
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = { verifyToken };
