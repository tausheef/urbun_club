// routes/docketRoutes.js
import express from "express";
import {
  createDocketWithDetails,
  getDocketWithDetails,
  getAllDockets,
  updateDocketWithDetails,
  deleteDocketWithDetails,
  getNextDocketNumber,
  toggleRto,
  getDeliveredDockets,    // ✅ NEW
  getUndeliveredDockets,  // ✅ NEW
  getPendingDockets,      // ✅ NEW
  getRTODockets,          // ✅ NEW
} from "../controllers/docketController.js";
import { 
  cancelDocket, 
  restoreDocket, 
  getCancelledDockets 
} from '../controllers/docketCancellationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ⚠️ CRITICAL: Specific routes MUST come BEFORE parameterized routes (/:docketId or /:id)
// Order matters! More specific paths must be registered first.

// ========== SPECIFIC ROUTES FIRST ==========

// GET - Next auto-generated docket number
router.get("/next-number", getNextDocketNumber);

// GET - All cancelled dockets (Admin only)
router.get('/cancelled', protect, adminOnly, getCancelledDockets);

// ✅ NEW: Status-based filtering routes (MUST be before /:docketId)
router.get('/delivered', getDeliveredDockets);
router.get('/undelivered', getUndeliveredDockets);
router.get('/pending', getPendingDockets);
router.get('/rto', getRTODockets);

// ========== GENERAL COLLECTION ROUTES ==========

// GET - Retrieve all dockets with their complete details
router.get("/", getAllDockets);

// POST - Create a new docket with all related details
router.post("/", createDocketWithDetails);

// ========== PARAMETERIZED ROUTES (MUST BE LAST) ==========

// PATCH - Toggle RTO (Return to Origin) status
router.patch('/:id/rto', toggleRto);

// PATCH - Cancel a docket (Admin only)
router.patch('/:id/cancel', protect, adminOnly, cancelDocket);

// PATCH - Restore a cancelled docket (Admin only)
router.patch('/:id/restore', protect, adminOnly, restoreDocket);

// GET - Retrieve a specific docket by ID with all related information
router.get("/:docketId", getDocketWithDetails);

// PUT - Update docket and related details
router.put("/:docketId", updateDocketWithDetails);

// DELETE - Delete docket and cascade delete all related documents
router.delete("/:docketId", deleteDocketWithDetails);

export default router;