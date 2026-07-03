// src/routes/reportActivation.js
const router = require("express").Router();
const reportActivationCtrl = require("../controllers/reportActivationController");

// Supports:
// ?period=day|week|month|range
// if period=range -> requires start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

router.get("/report/activation/total", reportActivationCtrl.getTotalActivations);
router.get(
  "/report/activation/total/excel",
  reportActivationCtrl.exportTotalActivationsExcel
);

router.get(
  "/report/activation/by-package",
  reportActivationCtrl.getActivationsByPackage
);
router.get(
  "/report/activation/by-package/excel",
  reportActivationCtrl.exportActivationsByPackageExcel
);

// Existing endpoints (date range)
router.get(
  "/report/activation/subscriptions",
  reportActivationCtrl.getActivationsByPackageDate
);
router.get(
  "/report/activation/subscriptions/excel",
  reportActivationCtrl.exportActivationsByPackageDateExcel
);

module.exports = router;
