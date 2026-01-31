const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT token expiration time (24 hours)
const JWT_EXPIRATION = "24h";

exports.login = async (userId, password) => {
  // Find user by userId
  const user = await User.findOne({ userId });
  if (!user) throw new Error("Invalid credentials");

  // Verify password
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new Error("Invalid credentials");

  // Check if user is active
  if (user.status !== "ACTIVE") {
    throw new Error("Account suspended - Contact administrator");
  }

  // Generate JWT with expiration
  return jwt.sign(
    {
      userId: user.userId,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};
