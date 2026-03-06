const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const User = require("../models/User");

exports.login = async (userId, password) => {
  const user = await User.findOne({ userId });
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new Error("Invalid credentials");

  // If MFA is enabled, return a short-lived MFA token instead of the full session token
  if (user.mfaEnabled) {
    const mfaToken = jwt.sign(
      { userId: user.userId, purpose: "mfa" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );
    return { mfaRequired: true, mfaToken };
  }

  // No MFA — update online status and return full session token
  user.isOnline = true;
  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    {
      userId: user.userId,
      role: user.role,
      status: user.status
    },
    process.env.JWT_SECRET
  );

  return { mfaRequired: false, token };
};

exports.verifyMfaLogin = async (mfaToken, totpCode) => {
  // Verify the short-lived MFA token
  let decoded;
  try {
    decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("MFA session expired. Please login again.");
  }

  if (decoded.purpose !== "mfa") {
    throw new Error("Invalid MFA token");
  }

  const user = await User.findOne({ userId: decoded.userId });
  if (!user) throw new Error("User not found");
  if (!user.mfaEnabled || !user.mfaSecret) throw new Error("MFA not configured");

  // Verify the TOTP code
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: "base32",
    token: totpCode,
    window: 2
  });

  if (!verified) {
    throw new Error("Invalid verification code");
  }

  // MFA verified — update online status and return full session token
  user.isOnline = true;
  user.lastLogin = new Date();
  await user.save();

  return jwt.sign(
    {
      userId: user.userId,
      role: user.role,
      status: user.status
    },
    process.env.JWT_SECRET
  );
};
