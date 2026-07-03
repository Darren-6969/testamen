// src/routes/branchesMobile.js
const express = require("express");
const router = express.Router();
const branchesMobileController = require("../controllers/branchesMobileController");
const { verifyToken } = require("../middleware/authMiddleware");

// ✅ list branches  GET /api/branches/mobile
router.get("/", branchesMobileController.getBranches);

// ✅ branch packages GET /api/branches/mobile/:branchId/packages
// IMPORTANT: put this BEFORE "/:branchId"
router.get("/:branchId/packages", branchesMobileController.getBranchPackages);

// (optional) GET /api/branches/mobile/:branchId
router.get("/:branchId", verifyToken, branchesMobileController.getBranchById);

// ✅ update branch PUT /api/branches/mobile/:branchId
router.put("/:branchId", verifyToken, branchesMobileController.updateBranch);

// ✅ create branch  POST /api/branches/mobile
router.post("/", verifyToken, branchesMobileController.createBranch);


module.exports = router;
