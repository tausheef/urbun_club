// controllers/ewayBillController.js
import Invoice from "../models/Invoice.js";
import Docket from "../models/Docket.js";
import BookingInfo from "../models/BookingInfo.js";

/**
 * Get ALL E-way Bills (expired + expiring soon + valid) with status
 */
export const getExpiredEwayBills = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    // Fetch ALL invoices that have an E-way Bill (no expiry filter)
    const allInvoices = await Invoice.find({
      eWayBill: { $exists: true, $ne: null, $ne: "" },
      eWayBillExpiry: { $exists: true, $ne: null }, // Must have expiry date
    })
      .populate({
        path: "docket",
        select: "docketNo distance destinationCity bookingDate",
        populate: {
          path: "consignor consignee",
          select: "consignorName consigneeName city",
        },
      })
      .sort({ eWayBillExpiry: 1 }); // Sort: expired first, then expiring soon, then valid

    // Fetch BookingInfo & compute status for each invoice
    const formattedDataPromises = allInvoices.map(async (invoice) => {
      // Get originCity from BookingInfo
      let originCity = "N/A";
      if (invoice.docket?._id) {
        const bookingInfo = await BookingInfo.findOne({ docketId: invoice.docket._id });
        originCity = bookingInfo?.originCity || "N/A";
      }

      const expiryDate = new Date(invoice.eWayBillExpiry);
      expiryDate.setHours(0, 0, 0, 0);

      // Calculate status
      let status = "valid";
      let daysOverdue = 0;
      let daysRemaining = 0;

      if (expiryDate < today) {
        // EXPIRED
        status = "expired";
        daysOverdue = Math.floor((today - expiryDate) / (1000 * 60 * 60 * 24));
      } else if (expiryDate <= threeDaysLater) {
        // EXPIRING SOON (within 3 days)
        status = "expiring_soon";
        daysRemaining = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      } else {
        // VALID
        status = "valid";
        daysRemaining = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      }

      return {
        _id: invoice._id,
        docketId: invoice.docket?._id,
        docketNo: invoice.docket?.docketNo || "N/A",
        invoiceNo: invoice.invoiceNo,
        eWayBill: invoice.eWayBill,
        originCity,
        destinationCity: invoice.docket?.destinationCity || "N/A",
        distance: invoice.docket?.distance || 0,
        bookingDate: invoice.docket?.bookingDate,
        expiryDate: invoice.eWayBillExpiry,
        status,          // "expired" | "expiring_soon" | "valid"
        daysOverdue,     // only meaningful if expired
        daysRemaining,   // only meaningful if valid / expiring_soon
        consignor: invoice.docket?.consignor?.consignorName || "N/A",
        consignee: invoice.docket?.consignee?.consigneeName || "N/A",
      };
    });

    const formattedData = await Promise.all(formattedDataPromises);

    // Summary counts
    const summary = {
      total: formattedData.length,
      expired: formattedData.filter((b) => b.status === "expired").length,
      expiringSoon: formattedData.filter((b) => b.status === "expiring_soon").length,
      valid: formattedData.filter((b) => b.status === "valid").length,
    };

    res.status(200).json({
      success: true,
      count: formattedData.length,
      summary,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching E-way Bills:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch E-way Bills",
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
 * Update E-way Bill expiry date
 */
export const updateEwayBillExpiry = async (req, res) => {
  try {
    const { id } = req.params; // Invoice _id
    const { eWayBillExpiry } = req.body;

    if (!eWayBillExpiry) {
      return res.status(400).json({
        success: false,
        message: "New expiry date is required",
      });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { eWayBillExpiry: new Date(eWayBillExpiry) },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "E-way Bill expiry updated successfully",
      data: { eWayBillExpiry: invoice.eWayBillExpiry },
    });
  } catch (error) {
    console.error("Error updating E-way Bill expiry:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update expiry date",
    });
  }
};

/**
 * Clear E-way Bill from invoice (for delivered dockets)
 * Removes eWayBill + eWayBillExpiry so it no longer appears in tracker
 */
export const clearEwayBill = async (req, res) => {
  try {
    const { id } = req.params; // Invoice _id

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { $unset: { eWayBill: "", eWayBillExpiry: "" } },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "E-way Bill cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing E-way Bill:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to clear E-way Bill",
    });
  }
};

/**
 * Get count of expiring soon E-way Bills (for notification badge)
 */
export const getExpiringSoonCount = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const count = await Invoice.countDocuments({
      eWayBill: { $exists: true, $ne: null, $ne: "" },
      eWayBillExpiry: {
        $gte: today,
        $lte: threeDaysLater,
      },
    });

    res.status(200).json({
      success: true,
      count: count,
    });
  } catch (error) {
    console.error("Error counting expiring soon E-way Bills:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to count expiring soon E-way Bills",
    });
  }
};

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
        select: "docketNo distance destinationCity bookingDate",
      })
      .sort({ eWayBillExpiry: 1 });

    const formattedDataPromises = expiringSoon.map(async (invoice) => {
      let originCity = "N/A";
      if (invoice.docket?._id) {
        const bookingInfo = await BookingInfo.findOne({ docketId: invoice.docket._id });
        originCity = bookingInfo?.originCity || "N/A";
      }

      return {
        ...invoice.toObject(),
        originCity,
      };
    });

    const formattedData = await Promise.all(formattedDataPromises);

    res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching expiring E-way Bills:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch expiring E-way Bills",
    });
  }
};