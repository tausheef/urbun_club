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

    // ✅ Check if RTO is enabled and add prefix to status
    let finalStatus = status;
    if (docket.rto === true && !status.startsWith("(RTO)")) {
      finalStatus = `(RTO) ${status}`;
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
      status: finalStatus, // ✅ Use finalStatus with RTO prefix if applicable
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

// ✅ FIXED: Get all activities for a specific docket
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

    // ✅ CRITICAL FIX: Return activities array directly in data, not wrapped in an object
    res.status(200).json({
      success: true,
      data: activities,  // ✅ Return array directly, not { docketNo, activities }
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
// ========================================================================
// ✅ NEW: Status-Based Docket Filtering Functions
// ========================================================================

/**
 * @desc    Get delivered dockets via activities
 * @route   GET /api/v1/activities/delivered-dockets
 * @access  Public
 */
export const getDeliveredDockets = async (req, res) => {
  try {
    // Get all activities sorted by date
    const activities = await Activity.find()
      .sort({ date: -1, time: -1 })
      .lean();

    console.log(`📊 Total activities: ${activities.length}`);

    // Group by docketId and get latest activity
    const latestActivityByDocket = {};
    activities.forEach(activity => {
      const docketId = activity.docketId.toString();
      if (!latestActivityByDocket[docketId]) {
        latestActivityByDocket[docketId] = activity;
      }
    });

    console.log(`📊 Unique dockets with activities: ${Object.keys(latestActivityByDocket).length}`);

    // Filter for delivered status
    const deliveredDocketIds = [];
    Object.entries(latestActivityByDocket).forEach(([docketId, activity]) => {
      const status = activity.status.toLowerCase().trim();
      
      // Check if delivered (case-insensitive)
      if (status.includes("delivered") && !status.includes("undelivered")) {
        deliveredDocketIds.push(docketId);
      }
    });

    console.log(`✅ Delivered dockets found: ${deliveredDocketIds.length}`);

    // Get full docket details
    const dockets = await Docket.find({
      _id: { $in: deliveredDocketIds }
    })
      .populate("consignor")
      .populate("consignee")
      .lean();

    // Import BookingInfo model
    const BookingInfo = (await import("../models/BookingInfo.js")).default;

    // Format response
    const result = await Promise.all(
      dockets.map(async (docket) => {
        // Get all activities for this docket
        const docketActivities = activities.filter(
          a => a.docketId.toString() === docket._id.toString()
        );

        // Get booking info
        const bookingInfo = await BookingInfo.findOne({ docketId: docket._id }).lean();

        return {
          docket: {
            _id: docket._id,
            docketNo: docket.docketNo,
            bookingDate: docket.bookingDate,
            expectedDeliveryDate: docket.expectedDelivery,
            destinationCity: docket.destinationCity,
            consignor: docket.consignor,
            consignee: docket.consignee,
            rto: docket.rto,
          },
          bookingInfo: bookingInfo || {
            originCity: docket.location || docket.destinationCity,
          },
          activities: docketActivities,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get undelivered dockets via activities
 * @route   GET /api/v1/activities/undelivered-dockets
 * @access  Public
 */
export const getUndeliveredDockets = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ date: -1, time: -1 })
      .lean();

    const latestActivityByDocket = {};
    activities.forEach(activity => {
      const docketId = activity.docketId.toString();
      if (!latestActivityByDocket[docketId]) {
        latestActivityByDocket[docketId] = activity;
      }
    });

    const undeliveredDocketIds = [];
    Object.entries(latestActivityByDocket).forEach(([docketId, activity]) => {
      const status = activity.status.toLowerCase().trim();
      if (status.includes("undelivered")) {
        undeliveredDocketIds.push(docketId);
      }
    });

    const dockets = await Docket.find({
      _id: { $in: undeliveredDocketIds }
    })
      .populate("consignor")
      .populate("consignee")
      .lean();

    const BookingInfo = (await import("../models/BookingInfo.js")).default;

    const result = await Promise.all(
      dockets.map(async (docket) => {
        const docketActivities = activities.filter(
          a => a.docketId.toString() === docket._id.toString()
        );

        const bookingInfo = await BookingInfo.findOne({ docketId: docket._id }).lean();

        return {
          docket: {
            _id: docket._id,
            docketNo: docket.docketNo,
            bookingDate: docket.bookingDate,
            expectedDeliveryDate: docket.expectedDelivery,
            destinationCity: docket.destinationCity,
            consignor: docket.consignor,
            consignee: docket.consignee,
            rto: docket.rto,
          },
          bookingInfo: bookingInfo || {
            originCity: docket.location || docket.destinationCity,
          },
          activities: docketActivities,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get pending dockets via activities
 * @route   GET /api/v1/activities/pending-dockets
 * @access  Public
 */
export const getPendingDockets = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ date: -1, time: -1 })
      .lean();

    const latestActivityByDocket = {};
    activities.forEach(activity => {
      const docketId = activity.docketId.toString();
      if (!latestActivityByDocket[docketId]) {
        latestActivityByDocket[docketId] = activity;
      }
    });

    const pendingDocketIds = [];
    Object.entries(latestActivityByDocket).forEach(([docketId, activity]) => {
      const status = activity.status.toLowerCase().trim();
      const isDelivered = status.includes("delivered") && !status.includes("undelivered");
      const isUndelivered = status.includes("undelivered");
      
      if (!isDelivered && !isUndelivered) {
        pendingDocketIds.push(docketId);
      }
    });

    const dockets = await Docket.find({
      _id: { $in: pendingDocketIds }
    })
      .populate("consignor")
      .populate("consignee")
      .lean();

    const BookingInfo = (await import("../models/BookingInfo.js")).default;

    const result = await Promise.all(
      dockets.map(async (docket) => {
        const docketActivities = activities.filter(
          a => a.docketId.toString() === docket._id.toString()
        );

        const bookingInfo = await BookingInfo.findOne({ docketId: docket._id }).lean();

        return {
          docket: {
            _id: docket._id,
            docketNo: docket.docketNo,
            bookingDate: docket.bookingDate,
            expectedDeliveryDate: docket.expectedDelivery,
            destinationCity: docket.destinationCity,
            consignor: docket.consignor,
            consignee: docket.consignee,
            rto: docket.rto,
          },
          bookingInfo: bookingInfo || {
            originCity: docket.location || docket.destinationCity,
          },
          activities: docketActivities,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get RTO dockets via activities
 * @route   GET /api/v1/activities/rto-dockets
 * @access  Public
 */
export const getRTODockets = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ date: -1, time: -1 })
      .lean();

    // Get all dockets with RTO flag
    const rtoDockets = await Docket.find({ rto: true })
      .populate("consignor")
      .populate("consignee")
      .lean();

    const rtoDocketIds = new Set(rtoDockets.map(d => d._id.toString()));

    // Also check activities for RTO status
    activities.forEach(activity => {
      const status = activity.status.toLowerCase().trim();
      if (status.includes("(rto)") || status.includes("rto") || 
          status.includes("return to origin") || status.includes("return to sender")) {
        rtoDocketIds.add(activity.docketId.toString());
      }
    });

    const dockets = await Docket.find({
      _id: { $in: Array.from(rtoDocketIds) }
    })
      .populate("consignor")
      .populate("consignee")
      .lean();

    const BookingInfo = (await import("../models/BookingInfo.js")).default;

    const result = await Promise.all(
      dockets.map(async (docket) => {
        const docketActivities = activities.filter(
          a => a.docketId.toString() === docket._id.toString()
        );

        const bookingInfo = await BookingInfo.findOne({ docketId: docket._id }).lean();

        return {
          docket: {
            _id: docket._id,
            docketNo: docket.docketNo,
            bookingDate: docket.bookingDate,
            expectedDeliveryDate: docket.expectedDelivery,
            destinationCity: docket.destinationCity,
            consignor: docket.consignor,
            consignee: docket.consignee,
            rto: docket.rto,
          },
          bookingInfo: bookingInfo || {
            originCity: docket.location || docket.destinationCity,
          },
          activities: docketActivities,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ NEW: Upload POD image to existing activity
export const uploadPODToActivity = async (req, res) => {
  try {
    const { activityId } = req.params;

    // Find the activity
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Delete old POD image from Cloudinary if exists
    if (activity.podImage && activity.podImage.publicId) {
      try {
        await cloudinary.uploader.destroy(activity.podImage.publicId);
      } catch (error) {
        console.error("Error deleting old image from Cloudinary:", error);
      }
    }

    // Update with new POD image
    activity.podImage = {
      url: req.file.path, // Cloudinary URL
      publicId: req.file.filename, // Cloudinary public_id
    };

    const updatedActivity = await activity.save();

    res.status(200).json({
      success: true,
      message: "POD image uploaded successfully",
      data: updatedActivity,
    });
  } catch (error) {
    console.error("Error uploading POD image:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload POD image",
    });
  }
};

// ✅ NEW: Delete POD image from existing activity
export const deletePODFromActivity = async (req, res) => {
  try {
    const { activityId } = req.params;

    // Find the activity
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // Check if activity has POD image
    if (!activity.podImage || !activity.podImage.publicId) {
      return res.status(404).json({
        success: false,
        message: "No POD image found for this activity",
      });
    }

    // Delete POD image from Cloudinary
    try {
      await cloudinary.uploader.destroy(activity.podImage.publicId);
      console.log(`Deleted POD image from Cloudinary: ${activity.podImage.publicId}`);
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
      // Continue even if Cloudinary deletion fails
    }

    // Remove POD image from activity (set to null)
    activity.podImage = null;
    const updatedActivity = await activity.save();

    res.status(200).json({
      success: true,
      message: "POD image deleted successfully",
      data: updatedActivity,
    });
  } catch (error) {
    console.error("Error deleting POD image:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete POD image",
    });
  }
};