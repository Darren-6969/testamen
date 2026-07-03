// src/routes/reportUserLogin.js
// const express = require('express');
// const router = express.Router();
const router = require('express').Router();
// const reportCustomerCtrl = require('../controllers/reportUserLoginController');


const {
  getUserLastLoginList,
  exportUserLastLoginExcel,
} = require('../controllers/reportUserLoginController');

// List (JSON)
router.get('/report/users/last-login', getUserLastLoginList);

// Export (Excel) - optional
router.get('/report/users/last-login/export', exportUserLastLoginExcel);

module.exports = router;
