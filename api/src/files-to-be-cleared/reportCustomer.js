// src/routes/reportCustomer.js
const router = require('express').Router();
const reportCustomerCtrl = require('../controllers/reportCustomerController');

// JSON list
router.get(
  '/report/customer/status',
  reportCustomerCtrl.getCustomerStatusList
);

// Excel export  👈 THIS must exist and match exactly
router.get(
  '/report/customer/status/excel',
  reportCustomerCtrl.exportCustomerStatusExcel
);

// New Customers JSON (period = day | week | month, via ?period=day)
router.get('/report/customer/new', reportCustomerCtrl.getNewCustomerList);

// New Customers Excel
router.get('/report/customer/new/excel', reportCustomerCtrl.exportNewCustomerExcel);

// 🔹 NEW: By Package JSON
router.get(
  '/report/customer/by-package',
  reportCustomerCtrl.getCustomerByPackageSummary
);

// 🔹 NEW: By Package Excel
router.get(
  '/report/customer/by-package/excel',
  reportCustomerCtrl.exportCustomerByPackageExcel
);

module.exports = router;
