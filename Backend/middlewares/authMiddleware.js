const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided. Please login again." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🌟 FIXED: Auto-extract handles wrapper structure securely 
    if (decoded.user) {
      req.user = decoded.user;
    } else {
      req.user = decoded;
    }

    // Double check safeguard fallback to avoid crashing endpoints
    if (!req.user.companyId) {
      console.error("JWT Payload lacks companyId context:", req.user);
      return res.status(400).json({ error: "Invalid token context: Company profile missing." });
    }

    next();
  } catch (err) {
    console.log("JWT Error:", err.message);
    return res.status(401).json({ error: "Session expired or invalid token. Please log in again." });
  }
};

module.exports = { protect };