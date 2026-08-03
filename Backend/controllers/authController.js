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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: true,        
  sameSite: "none",    
  maxAge: 7 * 24 * 60 * 60 * 1000 
});

    res.json({
      token: accessToken, 
      username: user.username,
      role: user.role,
      email: user.email
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken; 
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token missing" });
  }

  try {

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: "User not found" });

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

exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json("No token provided");
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    console.log("JWT Error:", err.message);
    res.status(401).json("Invalid token"); 
  }
};