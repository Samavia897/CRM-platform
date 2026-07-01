require("dotenv").config();
const express = require("express");
const sequelize = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const fundRoutes = require("./routes/fundRoutes");
const taskRoutes = require("./routes/taskRoutes");
const investorRoutes = require("./routes/investorRoutes");
const pipelineRoutes = require("./routes/pipelineRoutes"); // 🟢 FIXED 1: Pipeline routes ko import kiya
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// 🟢 ROUTES CONFIGURATION
app.use("/api/auth", authRoutes);
app.use("/api/investors", investorRoutes);
app.use("/api/funds", fundRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/pipelines", pipelineRoutes); // 🟢 FIXED 2: Pipeline routes ko register kar diya

// Database Sync aur Server Start
console.log("Attempting to sync database...");
sequelize.sync({ alter: true })
  .then(() => {
    console.log("Database & tables synced!");
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is successfully running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Failed to sync database:", err);
  });

// Process crash hone se rokne ke liye
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});