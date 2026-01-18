// routes/activityRoutes.js
import express from "express";
import {
  createActivity,
  getActivitiesByDocket,
  getAllActivities,
  deleteActivity,
} from "../controllers/ActivityController.js";
import { uploadPOD } from "../middleware/uploadPOD.js";

const router = express.Router();

// POST - Create a new activity (with single POD image)
// ✅ uploadPOD.single("podImage") allows ONLY 1 image
router.post("/", uploadPOD.single("podImage"), createActivity);

// GET - Get all activities for a specific docket
router.get("/docket/:docketId", getActivitiesByDocket);

// GET - Get all activities (for admin/dashboard)
router.get("/", getAllActivities);

// DELETE - Delete activity (and its POD image from Cloudinary)
router.delete("/:activityId", deleteActivity);

export default router;