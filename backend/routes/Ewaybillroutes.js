// routes/ewayBillRoutes.js
import express from "express";
import {
  getExpiredEwayBills,
  getExpiredCount,
  getExpiringSoon,
} from "../controllers/Ewaybillcontroller.js";

const router = express.Router();

// GET - Get all expired E-way Bills
router.get("/expired", getExpiredEwayBills);

// GET - Get count of expired E-way Bills
router.get("/expired/count", getExpiredCount);

// GET - Get E-way Bills expiring soon (within 3 days)
router.get("/expiring-soon", getExpiringSoon);

export default router;