const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

dotenv.config();
mongoose.set("strictQuery", true);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log(`Using database: ${mongoose.connection.db.databaseName}`);
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/v1/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "success", message: "Server running" });
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
