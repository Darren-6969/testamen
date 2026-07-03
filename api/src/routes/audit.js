// src/routes/audit.js
const router = require("express").Router();
const auditCtrl = require("../controllers/auditController");

// ✅ Support BOTH styles:
// 1) module.exports = verifyToken
// 2) module.exports = { verifyToken }
const authMw = require("../middleware/authMiddleware");
const verifyToken = authMw.verifyToken || authMw;

// ✅ sanity check (optional, remove later)
if (typeof verifyToken !== "function") {
  throw new Error("verifyToken is not a function. Check authMiddleware export.");
}
if (typeof auditCtrl.getAuditLogs !== "function") {
  throw new Error("auditCtrl.getAuditLogs is not a function. Check auditController export.");
}

// logs list
router.get("/logs", verifyToken, auditCtrl.getAuditLogs);
router.post("/logs", verifyToken, auditCtrl.getAuditLogs);

// (later) excel route - you don't have it yet, that's why you got Cannot GET /api/audit/logs/excel
router.get("/logs/excel", verifyToken, auditCtrl.exportAuditLogsExcel);

module.exports = router;
