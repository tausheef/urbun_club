// controllers/deliveryTrackerController.js
import Docket from "../models/Docket.js";
import BookingInfo from "../models/BookingInfo.js";

export const getDeliveryTracker = async (req, res) => {
  try {
    const Activity = (await import("../models/Activity.js")).default;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    // ✅ Removed strict docketStatus:"Active" — filter only Cancelled out
    const dockets = await Docket.find({
      expectedDelivery: { $exists: true, $ne: null },
      docketStatus: { $ne: "Cancelled" },
    })
      .populate("consignor", "consignorName")
      .populate("consignee", "consigneeName")
      .lean();

    if (!dockets.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        summary: { total: 0, overdue: 0, deliveringSoon: 0 },
        data: [],
      });
    }

    // ✅ Fetch BookingInfo only for relevant dockets
    const docketIds = dockets.map((d) => d._id);
    const bookingInfos = await BookingInfo.find({ docketId: { $in: docketIds } }).lean();
    const bookingInfoByDocket = {};
    bookingInfos.forEach((info) => {
      bookingInfoByDocket[info.docketId.toString()] = info;
    });

    // ✅ Sort by createdAt — most reliable field
    const activities = await Activity.find({ docketId: { $in: docketIds } })
      .sort({ createdAt: -1 })
      .lean();

    const activitiesByDocket = {};
    activities.forEach((activity) => {
      const id = activity.docketId.toString();
      if (!activitiesByDocket[id]) activitiesByDocket[id] = [];
      activitiesByDocket[id].push(activity);
    });

    const result = [];

    for (const docket of dockets) {
      const docketId = docket._id.toString();
      const docketActivities = activitiesByDocket[docketId] || [];

      // Skip already delivered
      if (docketActivities.length > 0) {
        const latestStatus = (docketActivities[0].status || "").toLowerCase().trim();
        if (latestStatus.includes("delivered") && !latestStatus.includes("undelivered")) {
          continue;
        }
      }

      // ✅ Validate expectedDelivery date
      const expectedDate = new Date(docket.expectedDelivery);
      if (isNaN(expectedDate.getTime())) continue;
      expectedDate.setHours(0, 0, 0, 0);

      let status = null;
      let daysOverdue = 0;
      let daysRemaining = 0;

      if (expectedDate <= today) {
        status = "overdue";
        daysOverdue = Math.floor((today - expectedDate) / (1000 * 60 * 60 * 24));
      } else if (expectedDate <= threeDaysLater) {
        status = "delivering_soon";
        daysRemaining = Math.floor((expectedDate - today) / (1000 * 60 * 60 * 24));
      }

      if (!status) continue;

      result.push({
        _id: docket._id,
        docketNo: docket.docketNo || "N/A",
        bookingDate: docket.bookingDate,
        expectedDelivery: docket.expectedDelivery,
        originCity: bookingInfoByDocket[docketId]?.originCity || "N/A",
        destinationCity: docket.destinationCity || "N/A",
        consignor: docket.consignor?.consignorName || "N/A",
        consignee: docket.consignee?.consigneeName || "N/A",
        latestStatus: docketActivities[0]?.status || "No Activity",
        status,
        daysOverdue,
        daysRemaining,
      });
    }

    result.sort((a, b) => {
      if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
      return new Date(a.expectedDelivery) - new Date(b.expectedDelivery);
    });

    const summary = {
      total: result.length,
      overdue: result.filter((d) => d.status === "overdue").length,
      deliveringSoon: result.filter((d) => d.status === "delivering_soon").length,
    };

    res.status(200).json({ success: true, count: result.length, summary, data: result });
  } catch (error) {
    console.error("Error in getDeliveryTracker:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch delivery tracker" });
  }
};

export const getOverdueCount = async (req, res) => {
  try {
    const Activity = (await import("../models/Activity.js")).default;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dockets = await Docket.find({
      expectedDelivery: { $exists: true, $ne: null, $lte: today },
      docketStatus: { $ne: "Cancelled" },
    }).lean();

    if (!dockets.length) return res.status(200).json({ success: true, count: 0 });

    const docketIds = dockets.map((d) => d._id);
    const activities = await Activity.find({ docketId: { $in: docketIds } })
      .sort({ createdAt: -1 })
      .lean();

    const latestByDocket = {};
    activities.forEach((a) => {
      const id = a.docketId.toString();
      if (!latestByDocket[id]) latestByDocket[id] = a;
    });

    const overdueCount = dockets.filter((d) => {
      const latest = latestByDocket[d._id.toString()];
      if (!latest) return true;
      const s = (latest.status || "").toLowerCase().trim();
      return !(s.includes("delivered") && !s.includes("undelivered"));
    }).length;

    res.status(200).json({ success: true, count: overdueCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};