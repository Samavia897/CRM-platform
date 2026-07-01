const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      companyId: user.companyId // <--- Yeh line add karna lazmi hai!
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};