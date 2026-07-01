const express = require("express");
const router = express.Router();
const investorController = require("../controllers/investorController");
const { protect } = require("../middlewares/authMiddleware");

// Purane standard routes
router.get("/", protect, investorController.getInvestors);
router.post("/", protect, investorController.createInvestor);
router.patch('/status/:id', protect, investorController.updateStatus);

// ======= YEH DO LINES NAYI ADD KAREIN =======
router.put("/:id", protect, investorController.updateInvestor);      // Edit submit ke liye
router.delete("/:id", protect, investorController.deleteInvestor);   // Delete click ke liye

module.exports = router;