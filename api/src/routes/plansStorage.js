const express = require('express');
const router = express.Router();

const {
  getPlansStorage,
  getPlansStorageById,
  createPlansStorage,
  updatePlansStorage,
  updatePlansStorageById,
  deletePlansStorage,
} = require('../controllers/plansStorageController');

router.get('/', getPlansStorage);
router.get('/:id', getPlansStorageById);
router.post('/', createPlansStorage);
router.put('/', updatePlansStorage);
router.put('/:id', updatePlansStorageById);
router.delete('/:id', deletePlansStorage);

module.exports = router;