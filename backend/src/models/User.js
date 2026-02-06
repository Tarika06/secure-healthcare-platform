const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: String,
  passwordHash: String,
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  role: {
    type: String,
    enum: ["PATIENT", "DOCTOR", "ADMIN"],
    default: function () {
      const prefix = this.userId.charAt(0).toUpperCase();
      if (prefix === "P") return "PATIENT";
      if (prefix === "D") return "DOCTOR";
      if (prefix === "A") return "ADMIN";
      return "PATIENT";
    }
  },
  specialty: { type: String, default: "" }, // For doctors
  status: {
    type: String,
    enum: ["ACTIVE", "SUSPENDED"],
    default: "ACTIVE"
  },
  acceptPrivacyPolicy: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", UserSchema);
