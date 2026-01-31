const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired - Please login again" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    // CRITICAL: Verify user actually exists in database
    const user = await User.findOne({ userId: decoded.userId }).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // Check if user account is active
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account suspended - Contact administrator" });
    }

    // Attach full user object to request for downstream use
    req.user = {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      specialty: user.specialty,
      status: user.status
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
