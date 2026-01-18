// controllers/ewayBillController.js
import Invoice from "../models/Invoice.js";
import Docket from "../models/Docket.js";
import BookingInfo from "../models/BookingInfo.js";

/**
 * Get all expired E-way Bills
 */
export const getExpiredEwayBills = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Find all invoices with E-way Bill that have expired
    const expiredInvoices = await Invoice.find({
      eWayBill: { $exists: true, $ne: null, $ne: "" },
      eWayBillExpiry: { $lt: today }, // Expiry date is before today
    })
      .populate({
        path: "docket",
        select: "docketNo distance destinationCity createdAt",
        populate: {
          path: "consignor consignee",
          select: "consignorName consigneeName city",
        },
      })
      .populate({
        path: "bookingInfo",
        select: "originCity", // ✅ Get origin city from BookingInfo
      })
      .sort({ eWayBillExpiry: 1 }); // Oldest expired first

    // Format the response
    const formattedData = expiredInvoices.map((invoice) => {
      const daysOverdue = Math.floor(
        (today - new Date(invoice.eWayBillExpiry)) / (1000 * 60 * 60 * 24)
      );

      return {
        _id: invoice._id,
        docketId: invoice.docket?._id,
        docketNo: invoice.docket?.docketNo || "N/A",
        invoiceNo: invoice.invoiceNo,
        eWayBill: invoice.eWayBill,
        originCity: invoice.bookingInfo?.originCity || "N/A", // ✅ Origin from BookingInfo
        destinationCity: invoice.docket?.destinationCity || "N/A", // ✅ Destination from Docket
        distance: invoice.docket?.distance || 0,
        createdAt: invoice.docket?.createdAt,
        expiryDate: invoice.eWayBillExpiry,
        daysOverdue: daysOverdue,
        consignor: invoice.docket?.consignor?.consignorName || "N/A",
        consignee: invoice.docket?.consignee?.consigneeName || "N/A",
      };
    });

    res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching expired E-way Bills:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch expired E-way Bills",
    });
  }
};

/**
 * Get count of expired E-way Bills (for notification badge)
 */
export const getExpiredCount = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await Invoice.countDocuments({
      eWayBill: { $exists: true, $ne: null, $ne: "" },
      eWayBillExpiry: { $lt: today },
    });

    res.status(200).json({
      success: true,
      count: count,
    });
  } catch (error) {
    console.error("Error counting expired E-way Bills:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to count expired E-way Bills",
    });
  }
};

/**
 * Get E-way Bills expiring soon (within next 3 days)
 */
export const getExpiringSoon = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const expiringSoon = await Invoice.find({
      eWayBill: { $exists: true, $ne: null, $ne: "" },
      eWayBillExpiry: {
        $gte: today,
        $lte: threeDaysLater,
      },
    })
      .populate({
        path: "docket",
        select: "docketNo distance destinationCity createdAt",
      })
      .populate({
        path: "bookingInfo",
        select: "originCity", // ✅ Get origin city
      })
      .sort({ eWayBillExpiry: 1 });

    res.status(200).json({
      success: true,
      count: expiringSoon.length,
      data: expiringSoon,
    });
  } catch (error) {
    console.error("Error fetching expiring E-way Bills:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch expiring E-way Bills",
    });
  }
};