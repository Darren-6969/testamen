// src/routes/reportPayment.js
const router = require("express").Router();
const ctrl = require("../controllers/paymentReportController");

const authMw = require("../middleware/authMiddleware");
const verifyToken = authMw.verifyToken || authMw;

// JSON
router.get("/total", verifyToken, ctrl.getTotalPayment);

// Excel
router.get("/total/excel", verifyToken, ctrl.exportTotalPaymentExcel);


router.get("/status-summary", verifyToken, ctrl.getPaymentStatusSummary);
router.get("/status-summary/excel", verifyToken, ctrl.exportPaymentStatusSummaryExcel);


module.exports = router;
