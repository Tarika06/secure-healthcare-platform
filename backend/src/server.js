require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");

const app = express();
connectDB();

app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patient",require("./routes/patientRoutes"));
app.use("/api/doctor",require("./routes/doctorRoutes"));
app.use("/api/admin",require("./routes/adminRoutes"));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
