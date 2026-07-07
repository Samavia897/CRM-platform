const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.patch("/:id", taskController.updateTaskStatus); 
router.delete("/:id", taskController.deleteTask); 

module.exports = router;