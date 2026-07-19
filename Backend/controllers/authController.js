// controllers/authController.js
const authService = require("../services/authService");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const jwt = require("jsonwebtoken");
const { User } = require("../models/index");

exports.signup = async (req, res) => {
  try {
    const user = await authService.signup(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    
    // 1. Dono tokens generate karein
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 2. Refresh Token ko HttpOnly cookie mein save karein (XSS safe)
    res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: true,        // Deployed site par HTTPS hota hai, toh true lazmi hai
  sameSite: "none",    // Cross-domain cookies support karne ke liye "none" zaroori hai
  maxAge: 7 * 24 * 60 * 60 * 1000 
});

    // 3. Response mein access token aur user details bhej dein
    res.json({
      token: accessToken, // Frontend par aapka current 'token' variable break nahi hoga
      username: user.username,
      role: user.role,
      email: user.email
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 4. NEW: Refresh Endpoint Controller
exports.refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken; // Iske liye backend par 'cookie-parser' packages install hona zaroori hai

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token missing" });
  }

  try {
    // Refresh token verify karein
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Database se user check karein taaki sure ho sakein user abhi bhi valid hai
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    // Naya Access Token issue karein
    const newAccessToken = generateAccessToken(user);

    res.json({ token: newAccessToken });
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { companyId: req.user.companyId }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Users fetch nahi ho sakay" });
  }
};

exports.addMember = async (req, res) => {
  try {
    const newMember = await authService.addMember(req.user.id, req.body);
    res.json({ message: "Member added successfully", user: newMember });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Aapka protection middleware bilkul same rahega, ye access token verify karega!
exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json("No token provided");
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Isme id, role, companyId sab kuch safely req.user mein aa jayega
    next();
  } catch (err) {
    console.log("JWT Error:", err.message);
    res.status(401).json("Invalid token"); // Frontend isi error par silent refresh trigger karega
  }
};