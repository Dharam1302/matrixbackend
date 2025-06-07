const express = require("express");
const router = express.Router();
const scanController = require("../controllers/scanController");
const authMiddleware = require("../middleware/auth");

router.post("/check-in", authMiddleware, scanController.checkIn);
router.post("/check-out", authMiddleware, scanController.checkOut);
router.post(
  "/override-checkout",
  authMiddleware,
  scanController.overrideCheckOut
);
router.get("/logs", authMiddleware, scanController.getLogs);
router.get("/seats", authMiddleware, scanController.getSeats);
router.post("/export-logs", authMiddleware, scanController.exportLogs);

module.exports = router;
