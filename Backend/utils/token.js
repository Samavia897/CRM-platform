const jwt = require("jsonwebtoken");

// Named exports standard tareeqay se
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, companyId: user.companyId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

// Explicitly object export karo taaki destructured require kaam kare
module.exports = {
  generateAccessToken,
  generateRefreshToken
};