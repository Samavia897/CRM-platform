const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController"); 
const { protect } = require("../middlewares/authMiddleware"); 


router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/all-users", protect, authController.getAllUsers);
router.post("/refresh", authController.refresh);


router.post("/add-member", protect, authController.addMember);

module.exports = router;