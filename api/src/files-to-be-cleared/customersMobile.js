// src/routes/customersMobile.js
const router = require("express").Router();
const { verifyToken } = require("../middleware/authMiddleware");
const customerCtrl = require("../controllers/customerController");
const mobileCtrl = require("../controllers/customersMobileController");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads/customers");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${timestamp}-${random}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Unsupported file type! Only PDF, image, or DOC allowed."));
};

const upload = multer({ storage, fileFilter });

// ✅ GET current logged-in customer profile (same output as /api/customers/me)
router.get("/me", verifyToken, customerCtrl.getMyCustomerProfile);

// ✅ PUT update own profile (FormData)
router.put(
  "/me",
  verifyToken,
  upload.fields([
    { name: "form_d_a", maxCount: 1 },
    { name: "form_d_b", maxCount: 1 },
    { name: "form_9_49", maxCount: 1 },
    { name: "form_13_49", maxCount: 1 },
    { name: "form_79_80_83", maxCount: 1 },
    { name: "file_latestbill", maxCount: 1 },
    { name: "file_other", maxCount: 1 },
  ]),
  mobileCtrl.updateMyCustomerProfile
);

// ✅ DELETE one attachment (own)
router.delete("/me/file/:field", verifyToken, mobileCtrl.deleteMyCustomerFile);

router.get("/groups", verifyToken, mobileCtrl.getCustomerGroups);
router.post("/groups", verifyToken, mobileCtrl.createCustomerGroup);
router.put("/groups/:groupId", verifyToken, mobileCtrl.updateCustomerGroup);
router.get("/groups/:groupId/customers", verifyToken, mobileCtrl.getCustomersByGroup);
router.post("/groups/:groupId/customers", verifyToken, mobileCtrl.addCustomerToGroup);
router.delete("/groups/:groupId/customers/:customerId", verifyToken, mobileCtrl.removeCustomerFromGroup);
router.get("/available-customers", verifyToken, mobileCtrl.getAvailableCustomers);

module.exports = router;