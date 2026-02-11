// routes/activityRoutes.js
import express from "express";
import {
  createActivity,
  getActivitiesByDocket,
  getAllActivities,
  deleteActivity,
  getDeliveredDockets,    // ✅ NEW
  getUndeliveredDockets,  // ✅ NEW
  getPendingDockets,      // ✅ NEW
  getRTODockets,          // ✅ NEW
  uploadPODToActivity,    // ✅ NEW - Upload POD to existing activity
  deletePODFromActivity,  // ✅ NEW - Delete POD from existing activity
} from "../controllers/ActivityController.js";
import { uploadPOD } from "../middleware/uploadPOD.js";

const router = express.Router();

// ✅ NEW: Status-based docket routes (BEFORE other routes)
router.get("/delivered-dockets", getDeliveredDockets);
router.get("/undelivered-dockets", getUndeliveredDockets);
router.get("/pending-dockets", getPendingDockets);
router.get("/rto-dockets", getRTODockets);

// POST - Create a new activity (with single POD image)
// ✅ uploadPOD.single("podImage") allows ONLY 1 image
router.post("/", uploadPOD.single("podImage"), createActivity);

// PATCH - Upload POD image to existing activity
router.patch("/:activityId/upload-pod", uploadPOD.single("podImage"), uploadPODToActivity);

// DELETE - Delete POD image from existing activity (keeps the activity)
router.delete("/:activityId/delete-pod", deletePODFromActivity);

// GET - Get all activities for a specific docket
router.get("/docket/:docketId", getActivitiesByDocket);

// GET - Get all activities (for admin/dashboard)
router.get("/", getAllActivities);

// DELETE - Delete activity (and its POD image from Cloudinary)
router.delete("/:activityId", deleteActivity);

export default router;