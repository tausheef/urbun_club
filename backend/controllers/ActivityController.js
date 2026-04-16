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
// ✅ OPTIMIZED: Status-Based Docket Filtering Functions
// Fixed: bulk BookingInfo fetch, no double Docket query, aggregation for status
// Response shape is IDENTICAL to before — no frontend changes needed
// ========================================================================

/**
 * SHARED HELPER — used by all 4 status functions
 * Accepts a list of docketIds already filtered by status,
 * bulk-fetches dockets + bookingInfos + their activities in 3 queries total.
 */
const buildStatusResponse = async (matchedDocketIds, allActivitiesByDocket) => {
  if (matchedDocketIds.length === 0) return [];

  // Bulk-fetch dockets for matched IDs — ONE query
  const dockets = await Docket.find({
    _id: { $in: matchedDocketIds },
    docketStatus: { $ne: "Cancelled" },
  })
    .populate("consignor")
    .populate("consignee")
    .lean();

  if (dockets.length === 0) return [];

  const docketIds = dockets.map((d) => d._id);

  // Bulk-fetch BookingInfos — ONE query (replaces N findOne calls)
  const BookingInfo = (await import("../models/BookingInfo.js")).default;
  const bookingInfos = await BookingInfo.find({ docketId: { $in: docketIds } }).lean();
  const bookingInfoMap = {};
  bookingInfos.forEach((b) => {
    bookingInfoMap[b.docketId.toString()] = b;
  });

  // Assemble — pure map, zero extra DB calls
  return dockets.map((docket) => {
    const id = docket._id.toString();
    const docketActivities = allActivitiesByDocket[id] || [];

    return {
      docket: {
        _id:                  docket._id,
        docketNo:             docket.docketNo,
        bookingDate:          docket.bookingDate,
        expectedDeliveryDate: docket.expectedDelivery,
        destinationCity:      docket.destinationCity,
        consignor:            docket.consignor,
        consignee:            docket.consignee,
        rto:                  docket.rto,
        docketStatus:         docket.docketStatus,
      },
      bookingInfo: bookingInfoMap[id] || {
        originCity: docket.destinationCity,
      },
      activities: docketActivities,
    };
  });
};

/**
 * SHARED HELPER — aggregates latest status per docket in ONE query
 * Returns: { docketIdStr → latestStatus }
 * Also returns allActivitiesByDocket map for response assembly
 */
const getActivityMaps = async () => {
  // ONE query — fetch all activities sorted newest first
  const activities = await Activity.find()
    .sort({ date: -1, time: -1 })
    .lean();

  // Build two maps in a single loop
  const latestStatusMap = {};      // docketId → latest status string
  const allActivitiesByDocket = {}; // docketId → all activities array

  activities.forEach((activity) => {
    const id = activity.docketId.toString();

    // First seen = latest (already sorted desc)
    if (!latestStatusMap[id]) {
      latestStatusMap[id] = activity.status;
    }

    if (!allActivitiesByDocket[id]) {
      allActivitiesByDocket[id] = [];
    }
    allActivitiesByDocket[id].push(activity);
  });

  return { latestStatusMap, allActivitiesByDocket };
};

/**
 * @desc    Get delivered dockets via activities
 * @route   GET /api/v1/activities/delivered-dockets
 * @access  Public
 */
export const getDeliveredDockets = async (req, res) => {
  try {
    const { latestStatusMap, allActivitiesByDocket } = await getActivityMaps();

    // Filter docket IDs whose latest status is "delivered" (not "undelivered")
    const matchedIds = Object.entries(latestStatusMap)
      .filter(([, status]) => {
        const s = status.toLowerCase().trim();
        return s.includes("delivered") && !s.includes("undelivered");
      })
      .map(([id]) => id);

    const result = await buildStatusResponse(matchedIds, allActivitiesByDocket);

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error("❌ Error fetching delivered dockets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get undelivered dockets via activities
 * @route   GET /api/v1/activities/undelivered-dockets
 * @access  Public
 */
export const getUndeliveredDockets = async (req, res) => {
  try {
    const { latestStatusMap, allActivitiesByDocket } = await getActivityMaps();

    const matchedIds = Object.entries(latestStatusMap)
      .filter(([, status]) => status.toLowerCase().trim().includes("undelivered"))
      .map(([id]) => id);

    const result = await buildStatusResponse(matchedIds, allActivitiesByDocket);

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error("❌ Error fetching undelivered dockets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get pending dockets via activities
 * @route   GET /api/v1/activities/pending-dockets
 * @access  Public
 */
export const getPendingDockets = async (req, res) => {
  try {
    const { latestStatusMap, allActivitiesByDocket } = await getActivityMaps();

    // Pending = NOT delivered AND NOT undelivered
    const matchedIds = Object.entries(latestStatusMap)
      .filter(([, status]) => {
        const s = status.toLowerCase().trim();
        const isDelivered   = s.includes("delivered") && !s.includes("undelivered");
        const isUndelivered = s.includes("undelivered");
        return !isDelivered && !isUndelivered;
      })
      .map(([id]) => id);

    const result = await buildStatusResponse(matchedIds, allActivitiesByDocket);

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error("❌ Error fetching pending dockets:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get RTO dockets via activities
 * @route   GET /api/v1/activities/rto-dockets
 * @access  Public
 */
export const getRTODockets = async (req, res) => {
  try {
    const { latestStatusMap, allActivitiesByDocket } = await getActivityMaps();

    // Collect docket IDs with ANY rto activity (not just latest)
    const rtoIds = new Set();

    // Check all activities for RTO mentions
    Object.entries(allActivitiesByDocket).forEach(([id, acts]) => {
      const hasRTO = acts.some((a) => {
        const s = a.status.toLowerCase().trim();
        return (
          s.includes("(rto)") ||
          s.includes("rto") ||
          s.includes("return to origin") ||
          s.includes("return to sender")
        );
      });
      if (hasRTO) rtoIds.add(id);
    });

    // Also include dockets with rto flag set — fetch those IDs
    const rtoDocketsByFlag = await Docket.find(
      { rto: true, docketStatus: { $ne: "Cancelled" } },
      "_id"
    ).lean();
    rtoDocketsByFlag.forEach((d) => rtoIds.add(d._id.toString()));

    const result = await buildStatusResponse(Array.from(rtoIds), allActivitiesByDocket);

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error("❌ Error fetching RTO dockets:", error);
    res.status(500).json({ success: false, message: error.message });
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