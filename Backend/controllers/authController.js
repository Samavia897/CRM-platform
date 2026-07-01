const authService = require("../services/authService");
const { generateToken } = require("../utils/token");
const jwt = require("jsonwebtoken");
// Models index file se hi lein
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
    const token = generateToken(user);

    res.json({
      token,
      username: user.username,
      role: user.role,     
      email: user.email
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
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

// Protect middleware ko bhi exports.protect ke taur par likhein
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

// AB AKHIR MEIN module.exports WALI LINE HATA DEIN