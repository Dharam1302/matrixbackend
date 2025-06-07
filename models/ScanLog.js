const mongoose = require("mongoose");

const scanLogSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true },
  name: { type: String, required: true },
  branch: { type: String, required: true },
  section: {
    type: String,
    required: true,
    enum: [
      "Central Library",
      "Reference",
      "Reference - Study Section",
      "Reading Room",
      "E-Library",
    ],
  },
  date: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String },
  status: { type: String, required: true, enum: ["Check-In", "Check-Out"] },
  duration: { type: String },
  isStudySection: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ScanLog", scanLogSchema);
