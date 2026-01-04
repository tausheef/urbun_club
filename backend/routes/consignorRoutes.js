import express from "express";
import {
  createConsignor,
  getAllConsignors,
  getConsignorById,
  updateConsignor,
  deleteConsignor,
} from "../controllers/consignorController.js";

const router = express.Router();

// CRUD routes
router.post("/", createConsignor);          // Create
router.get("/", getAllConsignors);         // Read all
router.get("/:id", getConsignorById);      // Read one
router.put("/:id", updateConsignor);       // Update
router.delete("/:id", deleteConsignor);    // Delete

export default router;
