// controllers/activityController.js
import Activity from "../models/Activity.js";
import Docket from "../models/Docket.js";
import cloudinary from "../config/cloudinary.js";

// Create new activity (with single POD image)
export const createActivity = async (req, res) => {
  try {
    const { docketId, status, location, date, time } = req.body;

    // Validate docket exists
    const docket = await Docket.findById(docketId);
    if (!docket) {
      return res.status(404).json({
        success: false,
        message: "Docket not found",
      });
    }

    // ✅ Process single POD image from Cloudinary
    let podImage = null;
    if (req.file) {
      podImage = {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename, // Cloudinary public_id
      };
    }

    // Create activity
    const activity = new Activity({
      docketId,
      status,
      location,
      date,
      time,
      podImage, // ✅ Single image
    });

    const savedActivity = await activity.save();

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: savedActivity,
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create activity",
    });
  }
};

// Get all activities for a specific docket
export const getActivitiesByDocket = async (req, res) => {
  try {
    const { docketId } = req.params;

    // Validate docket exists
    const docket = await Docket.findById(docketId);
    if (!docket) {
      return res.status(404).json({
        success: false,
        message: "Docket not found",
      });
    }

    // Get all activities for this docket, sorted by date/time (newest first)
    const activities = await Activity.find({ docketId }).sort({ date: -1, time: -1 });

    res.status(200).json({
      success: true,
      data: {
        docketNo: docket.docketNo,
        activities,
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activities",
    });
  }
};

// Get all activities (for admin/dashboard)
export const getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate("docketId", "docketNo")
      .sort({ date: -1, time: -1 });

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching all activities:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activities",
    });
  }
};

// Delete activity (and its POD image from Cloudinary)
export const deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // Delete POD image from Cloudinary (if exists)
    if (activity.podImage && activity.podImage.publicId) {
      try {
        await cloudinary.uploader.destroy(activity.podImage.publicId);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
      }
    }

    // Delete activity from database
    await Activity.findByIdAndDelete(activityId);

    res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete activity",
    });
  }
};

// Helper function to create "Booked" activity (called from docket controller)
export const createBookedActivity = async (docketId, originCity, createdAt) => {
  try {
    const date = new Date(createdAt);
    const time = date.toTimeString().slice(0, 5); // Format: HH:MM

    const activity = new Activity({
      docketId,
      status: "Booked",
      location: originCity,
      date: date,
      time: time,
      podImage: null, // No POD for "Booked" status
    });

    await activity.save();
    return { success: true };
  } catch (error) {
    console.error("Error creating booked activity:", error);
    return { success: false, error: error.message };
  }
};