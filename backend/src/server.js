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

// CORS — must be applied BEFORE all routes, including preflight
const corsOptions = {
  origin: (origin, callback) => {
    // Allow no-origin requests (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost (any port)
    if (origin.includes('localhost')) return callback(null, true);
    // Allow all Vercel deployments (production + preview)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow all Render deployments
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    // Allow explicitly listed origins
    const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
    if (extra.includes(origin)) return callback(null, true);
    // Deny everything else
    return callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// GLOBAL REQUEST LOGGER for debugging
app.use((req, res, next) => {
  console.log(`🔌 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Handle preflight OPTIONS
app.options('/{*path}', cors(corsOptions));



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

  let appVersion = "1.0.0";
  try { appVersion = require("../../package.json").version; } catch (e) {
    try { appVersion = require("../package.json").version; } catch (e2) { /* fallback */ }
  }

  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus[dbState] || "unknown",
    version: appVersion,
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
try {
  app.use("/api/deletion", require("./routes/deletionRoutes"));
  console.log("✅ Deletion routes loaded successfully");
} catch (err) {
  console.error("❌ FAILED to load deletion routes:", err.message);
}
app.use("/api/collaboration", require("./routes/collaborationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

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
