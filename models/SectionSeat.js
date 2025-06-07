const mongoose = require("mongoose");

const sectionSeatSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    unique: true,
    enum: ["central", "reference", "reading", "elibrary"],
  },
  total: { type: Number, required: true },
  available: { type: Number, required: true },
  occupied: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SectionSeat", sectionSeatSchema);
