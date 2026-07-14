const express = require("express");
const router = express.Router();
const investorController = require("../controllers/investorController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, investorController.getInvestors);
router.post("/", protect, investorController.createInvestor);
router.patch('/status/:id', protect, investorController.updateInvestorStatus);

router.put("/:id", protect, investorController.updateInvestor);
router.delete("/:id", protect, investorController.deleteInvestor);

module.exports = router;