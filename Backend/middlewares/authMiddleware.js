const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check karein header mojood hai ya nahi
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2. Token ko verify karein (Yahan sign hargiz nahi karna!)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. User info ko request mein daalein
    req.user = decoded; 
    next();
  } catch (err) {
    console.log("JWT Error:", err.message);
    res.status(401).json("Invalid token");
  }
};

module.exports = { protect };