const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.login = async (userId, password) => {
  
  const user = await User.findOne({ userId });
  if (!user) throw new Error("Invalid credentials");


  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new Error("Invalid credentials");

  return jwt.sign(
    { userId: user.userId },
    process.env.JWT_SECRET
  );
};
