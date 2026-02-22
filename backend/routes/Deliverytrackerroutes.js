// routes/deliveryTrackerRoutes.js
import express from "express";
import {
  getDeliveryTracker,
  getOverdueCount,
} from "../controllers/deliveryTrackerController.js"; // ✅ Fixed: was "./controllers/..." (wrong path)

const router = express.Router();

// ⚠️ Specific routes MUST come BEFORE the "/" route
// GET - Overdue count (for notification badge)
router.get("/overdue-count", getOverdueCount); // ✅ Fixed: moved above "/" to prevent shadowing

// GET - All overdue + delivering soon dockets
router.get("/", getDeliveryTracker);

export default router;