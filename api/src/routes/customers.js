// src/routes/customers.js
const router = require("express").Router();
const ctrl = require("../controllers/customerController");
const { verifyToken } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// Helpers
// =====================================================
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save under uploads/customers/
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const safeName = file.fieldname + '-' + timestamp + '-' + random + ext;
    cb(null, safeName);
  },
});

// File filter (optional — restrict allowed types)
const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Unsupported file type! Only PDF, image, or DOC allowed."));
};

const makeFileName = (file) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  return `${file.fieldname}-${timestamp}-${random}${ext}`;
};

// =====================================================
// 1) TMP upload (for public register - no userId yet)
// =====================================================
const tmpDir = path.join(__dirname, "../uploads/customers/tmp");
ensureDir(tmpDir);

const tmpStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => cb(null, makeFileName(file)),
});

const uploadTmp = multer({ storage: tmpStorage, fileFilter });

// =====================================================
// 2) Upload by Customer ID (for update / admin create)
// =====================================================
const customerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const customerId = req.uploadCustomerId;
    if (!customerId) return cb(new Error("Missing uploadCustomerId"));

    const userDir = path.join(__dirname, `../uploads/customers/${customerId}`);
    ensureDir(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => cb(null, makeFileName(file)),
});

const uploadByCustomer = multer({ storage: customerStorage, fileFilter });

// =====================================================
// Routes
// =====================================================
router.post("/", verifyToken, ctrl.getCustomers);
router.get("/list", verifyToken, ctrl.getCustomersCursor);
router.get("/modulelist", verifyToken, ctrl.getUserModules);

// ✅ put /me BEFORE /:id
router.get("/me", verifyToken, ctrl.getMyCustomerProfile);
router.get("/:id", verifyToken, ctrl.getCustomerById);

// delete file
router.delete("/:id/file/:field", verifyToken, ctrl.deleteCustomerFile);

// ✅ PUBLIC REGISTRATION (NO TOKEN) -> upload to tmp
router.post(
  "/public/register",
  uploadTmp.fields([
    { name: "form_d_a", maxCount: 1 },
    { name: "form_d_b", maxCount: 1 },
    { name: "form_9_49", maxCount: 1 },
    { name: "form_13_49", maxCount: 1 },
    { name: "form_79_80_83", maxCount: 1 },
    { name: "file_latestbill", maxCount: 1 },
    { name: "file_other", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  ctrl.publicRegisterCustomer
);

// ✅ update -> upload directly into /customers/:id/
router.put(
  "/:id",
  verifyToken,
  (req, res, next) => {
    req.uploadCustomerId = req.params.id;
    next();
  },
  uploadByCustomer.fields([
    { name: "form_d_a", maxCount: 1 },
    { name: "form_d_b", maxCount: 1 },
    { name: "form_9_49", maxCount: 1 },
    { name: "form_13_49", maxCount: 1 },
    { name: "form_79_80_83", maxCount: 1 },
    { name: "file_latestbill", maxCount: 1 },
    { name: "file_other", maxCount: 1 },
    { name: "signature", maxCount: 1 }, // include if update supports signature
  ]),
  ctrl.updateCustomer
);

// ✅ admin create (if you keep it) -> IMPORTANT:
// If your ctrl.createCustomer inserts userId inside controller,
// you cannot use folder-by-id in multer BEFORE controller.
// So keep admin create using TMP too (recommended), or create user first then upload.
// For now: simplest -> use TMP then move inside controller like public register.
router.post(
  "/add",
  verifyToken,
  uploadTmp.fields([
    { name: "form_d_a", maxCount: 1 },
    { name: "form_d_b", maxCount: 1 },
    { name: "form_9_49", maxCount: 1 },
    { name: "form_13_49", maxCount: 1 },
    { name: "form_79_80_83", maxCount: 1 },
    { name: "file_latestbill", maxCount: 1 },
    { name: "file_other", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  ctrl.createCustomer
);

router.post("/code", ctrl.getCustomerByCode);
router.post("/name", ctrl.getCustomerByName);

router.delete("/:id", verifyToken, ctrl.deleteCustomer);

// ============================================================================
// Export Router
// ============================================================================
module.exports = router;
