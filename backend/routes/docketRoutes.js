// routes/docketRoutes.js
import express from "express";
import {
  createDocketWithDetails,
  getDocketWithDetails,
  getAllDockets,
  updateDocketWithDetails,
  deleteDocketWithDetails,
} from "../controllers/docketController.js";

const router = express.Router();

// POST - Create a new docket with all related details
// This endpoint handles: Docket, BookingInfo, Invoice, Consignor, Consignee
router.post("/", createDocketWithDetails);

// GET - Retrieve all dockets with their complete details
router.get("/", getAllDockets);

// GET - Retrieve a specific docket by ID with all related information
router.get("/:docketId", getDocketWithDetails);

// PUT - Update docket and related details
router.put("/:docketId", updateDocketWithDetails);

// DELETE - Delete docket and cascade delete all related documents
router.delete("/:docketId", deleteDocketWithDetails);

export default router;