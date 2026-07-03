const express = require("express");
const router = express.Router();
const pipelineController = require("../controllers/pipelineController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/move", protect, pipelineController.moveInvestor);
router.post("/", protect, pipelineController.createPipeline);
router.get("/", protect, pipelineController.getPipelines);
module.exports = router;