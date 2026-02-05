require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

const app = express();
connectDB();

// CORS configuration for frontend
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patient", require("./routes/patientRoutes"));
app.use("/api/patient/gdpr", require("./routes/gdprRoutes"));
app.use("/api/doctor", require("./routes/doctorRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/records", require("./routes/recordRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/consent", require("./routes/consentRoutes"));
app.use("/api/mgmt", require("./routes/patientManagement"));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
