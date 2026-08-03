const express = require("express");
const router = express.Router();
const multer = require('multer');
const fundController = require("../controllers/fundController");
const { protect } = require("../middlewares/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", protect, fundController.getAllFunds);
router.post("/", protect, fundController.createFund);
router.get("/failed-report/:jobId", protect, fundController.getFailedJobReport)

router.post('/import', protect, upload.single('file'), fundController.importFunds);

router.delete('/:id', protect, fundController.deleteFund);
router.put('/:id', protect, fundController.updateFund);

module.exports = router;