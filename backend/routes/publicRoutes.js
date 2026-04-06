// routes/publicRoutes.js
// ✅ No auth required - public tracking endpoint

import express from "express";
import Docket from "../models/Docket.js";
import BookingInfo from "../models/BookingInfo.js";
import Invoice from "../models/Invoice.js";
import Activity from "../models/Activity.js";

const router = express.Router();

// GET /erp/api/v1/public/track/:docketNo
// Public tracking — no login required
router.get("/track/:docketNo", async (req, res) => {
  try {
    const docketNo = req.params.docketNo;

    // Search docket by docketNo (case-insensitive)
    const docket = await Docket.findOne({
      docketNo: { $regex: new RegExp("^" + docketNo + "$", "i") },
      docketStatus: { $ne: "Cancelled" }, // cancelled docket mat dikhao
    })
      .populate("consignor")
      .populate("consignee")
      .lean();

    // Nahi mila
    if (!docket) {
      return res.status(404).json({
        success: false,
        message: "No shipment found",
      });
    }

    // BookingInfo fetch karo
    const bookingInfo = await BookingInfo.findOne({
      docketId: docket._id,
    }).lean();

    // Invoice fetch karo
    const invoice = await Invoice.findOne({
      docket: docket._id,
    }).lean();

    // Activities fetch karo (shipment progress) - date order me
    const activities = await Activity.find({
      docketId: docket._id,
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    // Latest status
    const latestActivity = activities[activities.length - 1];
    const currentStatus = latestActivity?.status || "In Transit";

    // Total weight calculate karo dimensions se
    const totalWeight = docket.dimensions?.reduce(
      (sum, d) => sum + (d.weightOfPackets || 0),
      0
    ) || invoice?.weight || 0;

    // Total packets
    const totalPackets = docket.dimensions?.reduce(
      (sum, d) => sum + (d.noOfPackets || 0),
      0
    ) || invoice?.packet || 0;

    // Response
    res.json({
      success: true,
      source: "erp",
      data: {
        docketNo: docket.docketNo,
        consignorName: docket.consignor?.consignorName || "",
        consignorAddress: docket.consignor?.address || "",
        consignorCity: docket.consignor?.city || "",
        consignorPhone: docket.consignor?.phone || "",
        consigneeName: docket.consignee?.consigneeName || "",
        consigneeAddress: docket.consignee?.address || "",
        consigneeCity: docket.consignee?.city || "",
        consigneePhone: docket.consignee?.phone || "",
        origin: bookingInfo?.originCity || docket.consignor?.city || "",
        destination: docket.destinationCity || "",
        typeOfShipment: "Cargo",
        weight: totalWeight,
        unit: "Kgs",
        invoiceNo: invoice?.invoiceNo || "",
        quantity: totalPackets,
        bookingMode: bookingInfo?.deliveryMode || bookingInfo?.bookingMode || "",
        bookingDate: docket.bookingDate || null,
        mode: bookingInfo?.bookingMode || "ROAD",
        destinationOffice: docket.destinationCity || "",
        status: currentStatus,
        pickupDate: docket.bookingDate || null,
        deliveryDate: docket.expectedDelivery || null,
        rto: docket.rto || false,
        podImage: latestActivity?.podImage?.url || null,

        // Shipment progress
        progress: activities.map((a) => ({
          date: a.date,
          time: a.time,
          location: a.location,
          status: a.status,
        })),
      },
    });
  } catch (error) {
    console.error("Public tracking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;