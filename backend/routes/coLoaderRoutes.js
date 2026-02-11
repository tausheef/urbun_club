// routes/coLoaderRoutes.js
import express from "express";
import {
  createCoLoader,
  getAllCoLoaders,
  getCoLoaderById,
  getCoLoaderByDocketId,
  updateCoLoader,
  deleteCoLoader,
} from "../controllers/coLoaderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js"; // Cloudinary upload middleware

const router = express.Router();

// ✅ All routes require authentication
router.use(protect);

// Create co-loader (Everyone - with image upload)
router.post("/", upload.single("challan"), createCoLoader);

// Get all co-loaders (Everyone)
router.get("/", getAllCoLoaders);

// Get co-loader by docket ID (Everyone)
router.get("/docket/:docketId", getCoLoaderByDocketId);

// Get co-loader by ID (Everyone)
router.get("/:id", getCoLoaderById);

// Update co-loader (Admin only - with image upload)
router.put("/:id", adminOnly, upload.single("challan"), updateCoLoader);

// Delete co-loader (Admin only)
router.delete("/:id", adminOnly, deleteCoLoader);

export default router;