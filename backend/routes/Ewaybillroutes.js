// routes/ewayBillRoutes.js
import express from "express";
import {
  getExpiredEwayBills,
  getExpiredCount,
  getExpiringSoon,
  updateEwayBillExpiry,
  clearEwayBill,
} from "../controllers/Ewaybillcontroller.js";

const router = express.Router();

// GET - Get all E-way Bills (expired + expiring soon + valid)
router.get("/expired", getExpiredEwayBills);

// GET - Get count of expired E-way Bills
router.get("/expired/count", getExpiredCount);

// GET - Get E-way Bills expiring soon (within 3 days)
router.get("/expiring-soon", getExpiringSoon);

// PATCH - Update E-way Bill expiry date
router.patch("/:id/update-expiry", updateEwayBillExpiry);

// DELETE - Clear E-way Bill from invoice (delivered dockets)
router.delete("/:id/clear", clearEwayBill);

export default router;