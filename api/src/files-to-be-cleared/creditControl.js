// routes/creditControlRoutes.js

const express = require('express');
const router = express.Router();

const creditControlController = require('../controllers/creditControlController');

router.post(
  '/customers/:id/send-reminder',
  creditControlController.sendCustomerReminder
);

module.exports = router;