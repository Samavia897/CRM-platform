const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.patch("/:id", taskController.updateTaskStatus); // Yeh ab edit aur status toggle dono sambhal lega

// ======= NEW ROUTE ADDED =======
router.delete("/:id", taskController.deleteTask); // Delete handler link kiya

module.exports = router;