require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

// ── Prometheus Metrics Setup ────────────────────────────────────
const promClient = require("prom-client");

// Collect default metrics (CPU, memory, event loop, etc.)
promClient.collectDefaultMetrics({ prefix: "securecare_" });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: "securecare_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new promClient.Counter({
  name: "securecare_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const activeConnections = new promClient.Gauge({
  name: "securecare_active_connections",
  help: "Number of active connections",
});

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

// ── Prometheus Middleware: Track every request ──────────────────
app.use((req, res, next) => {
  activeConnections.inc();
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode,
    };
    end(labels);
    httpRequestTotal.inc(labels);
    activeConnections.dec();
  });

  next();
});

// ── Health Check Endpoint ───────────────────────────────────────
app.get("/api/health", async (req, res) => {
  const mongoose = require("mongoose");
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus[dbState] || "unknown",
    version: require("../../package.json").version,
  });
});

// ── Prometheus Metrics Endpoint ─────────────────────────────────
app.get("/api/metrics", async (req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

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
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/mfa", require("./middleware/authenticate"), require("./routes/mfaRoutes"));


const startServer = async () => {
  await connectDB();

  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
};

startServer();
