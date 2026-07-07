const express = require("express");
const router = express.Router();
const multer = require('multer');
const fundController = require("../controllers/fundController");
const { protect } = require("../middlewares/authMiddleware");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });


router.get("/", protect, fundController.getAllFunds);
router.post("/", protect, fundController.createFund);
router.post('/import', protect, upload.single('file'), fundController.importFunds);
router.delete('/:id', protect, fundController.deleteFund);
router.put('/:id', protect, fundController.updateFund);

module.exports = router;