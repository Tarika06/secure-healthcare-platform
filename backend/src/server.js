require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

const app = express();
// connectDB() called in startServer

// CORS configuration - allow any localhost port for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow any localhost port
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }

    // Allow configured origins
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());
app.use(require("./middleware/checkBlockedIP"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patient", require("./routes/patientRoutes"));
app.use("/api/patient/gdpr", require("./routes/gdprRoutes"));
app.use("/api/doctor", require("./routes/doctorRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/records", require("./routes/recordRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/consent", require("./routes/consentRoutes"));
app.use("/api/mgmt", require("./routes/patientManagement"));
app.use("/api/pm", require("./routes/patientManagement"));  // Alias
app.use("/api/gdpr", require("./routes/gdprRoutes"));       // Direct GDPR access
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/mfa", require("./middleware/authenticate"), require("./routes/mfaRoutes"));
app.use("/api/deletion", require("./routes/deletionRoutes"));
app.use("/api/collaboration", require("./routes/collaborationRoutes"));

// Import deletion cron job
const { startDeletionCron } = require("./services/deletionCron");

const startServer = async () => {
  await connectDB();

  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);

    // Start the deletion cron job
    startDeletionCron();
  });
};

startServer();
