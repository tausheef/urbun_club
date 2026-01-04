import express from "express";
import {
  createConsignee,
  getAllConsignees,
  getConsigneeById,
  updateConsignee,
  deleteConsignee,
} from "../controllers/consigneeController.js";

const router = express.Router();

// CRUD routes
router.post("/", createConsignee);          // Create
router.get("/", getAllConsignees);         // Read all
router.get("/:id", getConsigneeById);      // Read one
router.put("/:id", updateConsignee);       // Update
router.delete("/:id", deleteConsignee);    // Delete

export default router;
