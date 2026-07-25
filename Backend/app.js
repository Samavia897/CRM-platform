require("dotenv").config();
const express = require("express");
const sequelize = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const fundRoutes = require("./routes/fundRoutes");
const taskRoutes = require("./routes/taskRoutes");
const investorRoutes = require("./routes/investorRoutes");
const pipelineRoutes = require("./routes/pipelineRoutes");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
   origin: ["https://my-crm-client.onrender.com", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/investors", investorRoutes);
app.use("/api/funds", fundRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/pipelines", pipelineRoutes);

console.log("Attempting to sync database...");
sequelize.sync()
  .then(() => {
    console.log("Database connected & synced successfully!");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
  });


process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});