const Student = require("../models/Student");
const ScanLog = require("../models/ScanLog");
const SectionSeat = require("../models/SectionSeat");

exports.checkIn = async (req, res) => {
  try {
    const { rollNumber, section } = req.body;
    if (!rollNumber || !section) {
      return res
        .status(400)
        .json({ success: false, message: "Roll number and section required" });
    }

    const student = await Student.findOne({ rollNumber });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const today = new Date().toISOString().split("T")[0];
    const activeLog = await ScanLog.findOne({
      rollNumber,
      date: today,
      status: "Check-In",
      checkOut: null,
    });
    if (activeLog) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Student is already checked in at ${activeLog.section}`,
        });
    }

    const sectionSeat = await SectionSeat.findOne({ section });
    if (!sectionSeat || sectionSeat.available <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "No seats available" });
    }

    let sectionLabel = section;
    let isStudySection = false;
    const now = new Date();

    if (section === "reference") {
      const isAfter430 =
        now.getHours() > 16 ||
        (now.getHours() === 16 && now.getMinutes() >= 30);
      sectionLabel = isAfter430 ? "Reference - Study Section" : "Reference";
      isStudySection = isAfter430;
    } else if (section === "central") {
      sectionLabel = "Central Library";
    } else if (section === "reading") {
      sectionLabel = "Reading Room";
    } else if (section === "elibrary") {
      sectionLabel = "E-Library";
    }

    const checkInTime = now.toLocaleTimeString("en-IN", { hour12: false });

    const log = await ScanLog.create({
      rollNumber,
      name: student.name,
      branch: student.branch,
      section: sectionLabel,
      date: today,
      checkIn: checkInTime,
      status: "Check-In",
      isStudySection,
    });

    await SectionSeat.updateOne(
      { section },
      { $inc: { available: -1, occupied: 1 }, updatedAt: new Date() }
    );

    res
      .status(201)
      .json({
        success: true,
        message: `Check-in recorded for ${student.name}`,
        data: log,
      });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { rollNumber, section } = req.body;
    if (!rollNumber || !section) {
      return res
        .status(400)
        .json({ success: false, message: "Roll number and section required" });
    }

    const today = new Date().toISOString().split("T")[0];
    let sectionLabel = section;
    const now = new Date();

    if (section === "reference") {
      const isAfter430 =
        now.getHours() > 16 ||
        (now.getHours() === 16 && now.getMinutes() >= 30);
      sectionLabel = isAfter430 ? "Reference - Study Section" : "Reference";
    } else if (section === "central") {
      sectionLabel = "Central Library";
    } else if (section === "reading") {
      sectionLabel = "Reading Room";
    } else if (section === "elibrary") {
      sectionLabel = "E-Library";
    }

    const log = await ScanLog.findOne({
      rollNumber,
      section: sectionLabel,
      date: today,
      status: "Check-In",
      checkOut: null,
    });
    if (!log) {
      return res
        .status(404)
        .json({ success: false, message: "No active check-in found" });
    }

    const checkOutTime = now.toLocaleTimeString("en-IN", { hour12: false });
    const checkInTime = new Date(`${today}T${log.checkIn}`);
    const durationMs = now - checkInTime;
    const duration = `${Math.floor(durationMs / 3600000)}h ${Math.floor(
      (durationMs % 3600000) / 60000
    )}m`;

    await log.updateOne({
      checkOut: checkOutTime,
      status: "Check-Out",
      duration: durationMs,
    });

    await SectionSeat.updateOne(
      { section },
      { $inc: { available: 1, occupied: -1 }, updatedAt: new Date() }
    );

    res.json({
      success: true,
      message: "Check-out recorded",
      data: { ...log.toObject(), checkOut: checkOutTime, duration },
    });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.overrideCheckOut = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const { rollNumber, section } = req.body;
    if (!rollNumber || !section) {
      return res
        .status(400)
        .json({ success: false, message: "Roll number and section required" });
    }

    const today = new Date().toISOString().split("T")[0];
    const log = await ScanLog.findOne({
      rollNumber,
      date: today,
      status: "Check-In",
      checkOut: null,
    });
    if (!log) {
      return res
        .status(404)
        .json({ success: false, message: "No active check-in found" });
    }

    const checkOutTime = new Date().toLocaleTimeString("en-IN", {
      hour12: false,
    });
    const checkInTime = new Date(`${today}T${log.checkIn}`);
    const durationMs = new Date() - checkInTime;
    const duration = `${Math.floor(durationMs / 3600000)}h ${Math.floor(
      (durationMs % 3600000) / 60000
    )}m`;

    await log.updateOne({
      checkOut: checkOutTime,
      status: "Check-Out",
      duration: durationMs,
    });

    await SectionSeat.updateOne(
      { section },
      { $inc: { available: 1, occupied: -1 }, updatedAt: new Date() }
    );

    res.json({
      success: true,
      message: `Manual check-out recorded for ${log.name}`,
      data: { ...log.toObject(), checkOut: checkOutTime, duration },
    });
  } catch (error) {
    console.error("Override check-out error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { fromDate, toDate, section } = req.query;
    const query = {};

    if (fromDate && toDate) {
      query.date = { $gte: fromDate, $lte: toDate };
    }

    if (section && section !== "all") {
      query.section =
        section === "reference"
          ? { $in: ["Reference", "Reference - Study Section"] }
          : section;
    }

    const logs = await ScanLog.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch logs" });
  }
};

exports.getSeats = async (req, res) => {
  try {
    const seats = await SectionSeat.find();
    res.status(200).json({ success: true, seats });
  } catch (error) {
    console.error("Get seats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch seats" });
  }
};

exports.exportLogs = async (req, res) => {
  try {
    const { fromDate, toDate, section } = req.body;
    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ success: false, message: "Date range required" });
    }

    const query = { date: { $gte: fromDate, $lte: toDate } };
    if (section && section !== "all") {
      query.section =
        section === "reference"
          ? { $in: ["Reference", "Reference - Study Section"] }
          : section;
    }

    const logs = await ScanLog.find(query);

    const headers = [
      "Roll Number",
      "Name",
      "Branch",
      "Section",
      "Date",
      "Check-In",
      "Check-Out",
      "Duration",
      "Status",
    ];

    const rows = logs.map((log) => [
      log.rollNumber,
      log.name,
      log.branch,
      log.section,
      log.date,
      log.checkIn,
      log.checkOut || "-",
      log.duration
        ? `${Math.floor(log.duration / 3600000)}h ${Math.floor(
            (log.duration % 3600000) / 60000
          )}m`
        : "-",
      log.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="library-logs_${fromDate}_to_${toDate}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Export logs error:", error);
    res.status(500).json({ success: false, message: "Failed to export logs" });
  }
};
