const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const Student = require("./models/Student");
const SectionSeat = require("./models/SectionSeat");

dotenv.config();
mongoose.set("strictQuery", true);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Seed initial data
const seedData = async () => {
  try {
    // Seed Students
    const students = [
      { rollNumber: "24M11MC176", name: "Narayana", branch: "MCA" },
      { rollNumber: "24M11MC171", name: "Teja", branch: "MCA" },
      { rollNumber: "24M11MC123", name: "Anitha", branch: "MCA" },
      { rollNumber: "24M11MC190", name: "Thanusha", branch: "MCA" },
      { rollNumber: "24M11MC139", name: "Radha", branch: "MCA" },
      { rollNumber: "24M11MC167", name: "Venkat", branch: "MCA" },
      { rollNumber: "24M11MC001", name: "Rahul", branch: "MCA" },
      { rollNumber: "24M11MC002", name: "Priya", branch: "MCA" },
      { rollNumber: "24M11MC003", name: "Amit", branch: "MCA" },
      { rollNumber: "24M11MC004", name: "Sneha", branch: "MCA" },
      { rollNumber: "24M11MC005", name: "Kiran", branch: "MCA" },
      { rollNumber: "24M11MC006", name: "Vikram", branch: "MCA" },
      { rollNumber: "24M11MC007", name: "Neha", branch: "MCA" },
      { rollNumber: "24M11MC008", name: "Rajesh", branch: "MCA" },
      { rollNumber: "24M11MC009", name: "Pooja", branch: "MCA" },
      { rollNumber: "24C11CS010", name: "Arjun", branch: "CSE" },
      { rollNumber: "24C11CS011", name: "Divya", branch: "CSE" },
      { rollNumber: "24E11EC012", name: "Karthik", branch: "ECE" },
      { rollNumber: "24E11EC013", name: "Meera", branch: "ECE" },
      { rollNumber: "24M11ME014", name: "Suresh", branch: "MECH" },
    ];
    for (const student of students) {
      if (!(await Student.findOne({ rollNumber: student.rollNumber }))) {
        await Student.create(student);
        console.log(`Created student: ${student.rollNumber}`);
      }
    }

    // Seed Section Seats
    const sectionSeats = [
      { section: "central", total: 450, available: 450, occupied: 0 },
      { section: "reference", total: 300, available: 300, occupied: 0 },
      { section: "reading", total: 400, available: 400, occupied: 0 },
      { section: "elibrary", total: 150, available: 150, occupied: 0 },
    ];
    for (const seat of sectionSeats) {
      if (!(await SectionSeat.findOne({ section: seat.section }))) {
        await SectionSeat.create(seat);
        console.log(`Created section seat: ${seat.section}`);
      }
    }
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log(`Using database: ${mongoose.connection.db.databaseName}`);
    seedData();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
const authRoutes = require("./routes/auth");
const scanRoutes = require("./routes/scan");
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/scan", scanRoutes);

// Health check
app.get("/health", (req, res) =>
  res.status(200).json({ status: "success", body: "Server running" })
);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
