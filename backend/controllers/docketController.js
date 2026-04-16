// controllers/docketController.js
import Docket from "../models/Docket.js";
import cloudinary from "../config/cloudinary.js";
import BookingInfo from "../models/BookingInfo.js";
import Invoice from "../models/Invoice.js";
import Consignor from "../models/Consignor.js";
import Consignee from "../models/Consignee.js";
import DocketCounter from "../models/DocketCounter.js";
// ✅ REMOVED: No auto-calculations needed - distance and expiry are manual inputs

import { unlinkSync, existsSync, statSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
// Helper function to parse DD/MM/YYYY format OR ISO date strings
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Check if it's already a valid ISO date string (from frontend)
  if (typeof dateString === 'string' && dateString.includes('T')) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Handle DD/MM/YYYY format (legacy support)
  if (typeof dateString === 'string' && dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    if (!day || !month || !year) return null;
    const date = new Date(`${year}-${month}-${day}`);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Try parsing as a regular date string
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// ✅ Generate PDF for lorry receipt using Puppeteer (Node.js only, no Python)
export const generateLorryReceiptPDF = async (req, res) => {
  const { docketId } = req.params;
  const { showSignature } = req.query;
  let outputFile = null;

  console.log('📄 PDF Generation Request:', { docketId, showSignature });

  try {
    // 1. Fetch docket data
    const docket = await Docket.findById(docketId)
      .populate("consignor")
      .populate("consignee")
      .lean();

    if (!docket) {
      return res.status(404).json({ success: false, message: "Docket not found" });
    }

    const bookingInfo = await BookingInfo.findOne({ docketId: docket._id }).lean();
    const invoice    = await Invoice.findOne({ docket: docket._id }).lean();

    const docketData = {
      docket: {
        docketNo:        docket.docketNo,
        bookingDate:     docket.bookingDate,
        destinationCity: docket.destinationCity,
        expectedDelivery:docket.expectedDelivery,
        dimensions:      docket.dimensions,
        consignor: {
          consignorName: docket.consignor?.consignorName,
          address:       docket.consignor?.address,
          city:          docket.consignor?.city,
          state:         docket.consignor?.state,
          pin:           docket.consignor?.pin,
          phone:         docket.consignor?.phone,
        },
        consignee: {
          consigneeName: docket.consignee?.consigneeName,
          address:       docket.consignee?.address,
          city:          docket.consignee?.city,
          state:         docket.consignee?.state,
          pin:           docket.consignee?.pin,
          phone:         docket.consignee?.phone,
        },
      },
      bookingInfo: {
        originCity:   bookingInfo?.originCity,
        deliveryMode: bookingInfo?.deliveryMode,
      },
      invoice: {
        invoiceNo:         invoice?.invoiceNo,
        grossInvoiceValue: invoice?.grossInvoiceValue,
        packet:            invoice?.packet,
        weight:            invoice?.weight,
        itemDescription:   invoice?.itemDescription,
      },
    };

    // 2. File paths
    const outputDir      = path.join(__dirname, '..', 'output');
    const templatePath   = path.join(__dirname, '..', 'assets', 'lorry_receipt_template.png');
    const signaturePath  = path.join(__dirname, '..', 'assets', 'sign.png');
    const pdfGenerator   = path.join(__dirname, '..', 'scripts', 'generateLorryReceiptPDF.js');

    mkdirSync(outputDir, { recursive: true });

    const jobId  = uuidv4();
    outputFile   = path.join(outputDir, `lorry_receipt_${jobId}.pdf`);

    // 3. Import and run the puppeteer generator directly (same Node process)
    const { generatePDF } = await import(pdfGenerator);

    await generatePDF(
      docketData,
      templatePath,
      outputFile,
      signaturePath,
      showSignature === 'true'
    );

    // 4. Verify output
    if (!existsSync(outputFile)) {
      throw new Error('PDF file was not created');
    }
    const fileSize = statSync(outputFile).size;
    if (fileSize === 0) {
      throw new Error('PDF file is empty');
    }

    console.log('✅ PDF created! Size:', fileSize, 'bytes');

    // 5. Send file
    const docketNo = docketData.docket?.docketNo || 'receipt';
    const filename = `lorry_receipt_${docketNo}.pdf`;

    res.sendFile(outputFile, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    }, (err) => {
      if (existsSync(outputFile)) unlinkSync(outputFile);
      if (err) console.error('❌ Error sending file:', err);
      else     console.log('✅ PDF sent successfully!');
    });

  } catch (error) {
    console.error('❌ PDF generation error:', error.message);
    if (outputFile && existsSync(outputFile)) unlinkSync(outputFile);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};




// ✅ NEW: Get next auto-generated docket number
export const getNextDocketNumber = async (req, res) => {
  try {
    // Find or create the counter
    let counter = await DocketCounter.findById("auto-docket-counter");
    
    if (!counter) {
      // Create initial counter if it doesn't exist
      counter = new DocketCounter({
        _id: "auto-docket-counter",
        lastNumber: 53220,  // Will start from 53221
        prefix: "05"
      });
      await counter.save();
    }

    // Calculate next number
    const nextNumber = counter.lastNumber + 1;
    const nextDocketNo = `${counter.prefix}${nextNumber}`;

    res.status(200).json({
      success: true,
      data: {
        nextDocketNo: nextDocketNo,
        isAutoGenerated: true
      }
    });
  } catch (error) {
    console.error("Error getting next docket number:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get next docket number",
    });
  }
};

export const createDocketWithDetails = async (req, res) => {
  try {
    const {
      // Docket fields
      docketNo,
      bookingDate,
      destinationCity,
      postalCode,
      expectedDelivery,
      isAutoGenerated, // ✅ NEW: Flag to track if auto-generated
      
      // BookingInfo fields
      customerType,
      bookingMode,
      originCity,
      billingParty,
      billingAt,
      bookingType,
      deliveryMode,
      loadType,
      gstinNo,
      
      // Invoice fields
      eWayBill,
      invNo,
      invDate,
      partNo,
      itemDesc,
      weight,
      packet,
      netInvValue,
      gInvValue,
      
      // Consignor fields
      isTemporaryConsignor,
      consignor,
      consignorAddress,
      consignorCity,
      consignorState,
      consignorPin,
      consignorPhone,
      crgstinNo,
      
      // Consignee fields
      isTemporaryConsignee,
      consignee,
      consigneeAddress,
      consigneeCity,
      consigneeState,
      consigneePin,
      consigneePhone,
      cegstinNo,
      
      // Dimensions array
      dimensions,
    } = req.body;

    // ✅ Duplicate check — reject early before creating any related documents
    if (!docketNo || !docketNo.trim()) {
      return res.status(400).json({ success: false, message: "Docket No. is required" });
    }
    const existing = await Docket.findOne({ 
      docketNo: docketNo.trim(),
      docketStatus: { $ne: 'Cancelled' }, // cancelled docket numbers can be reused
    }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Docket No. "${docketNo.trim()}" already exists. Please use a unique docket number.`,
        field: "docketNo",
      });
    }

    // ✅ NEW: Update counter ONLY if this is an auto-generated docket
    if (isAutoGenerated) {
      const counter = await DocketCounter.findById("auto-docket-counter");
      
      if (counter) {
        // Extract number from docket number (remove prefix "05" only)
        // Example: "053221" → remove "05" → "3221" → parseInt → 3221
        const docketNumber = parseInt(docketNo.substring(2)); // Remove first 2 characters (prefix "05")
        
        // Update counter to this number
        counter.lastNumber = docketNumber;
        counter.updatedAt = new Date();
        await counter.save();
      }
    }

    // 1. Create Consignor
    let consignorId = null;
    if (consignor) {
      const consignorData = new Consignor({
        isTemporary: isTemporaryConsignor || false,
        consignorName: consignor,
        address: consignorAddress,
        city: consignorCity,
        pin: consignorPin,
        state: consignorState,
        phone: consignorPhone,
        crgstinNo: crgstinNo,
      });
      const savedConsignor = await consignorData.save();
      consignorId = savedConsignor._id;
    }

    // 2. Create Consignee
    let consigneeId = null;
    if (consignee) {
      const consigneeData = new Consignee({
        isTemporary: isTemporaryConsignee || false,
        consigneeName: consignee,
        address: consigneeAddress,
        city: consigneeCity,
        pin: consigneePin,
        state: consigneeState,
        phone: consigneePhone,
        cegstinNo: cegstinNo,
      });
      const savedConsignee = await consigneeData.save();
      consigneeId = savedConsignee._id;
    }

    // Process dimensions array
    const processedDimensions = Array.isArray(dimensions) 
      ? dimensions.map(dim => ({
          length: parseFloat(dim.length) || 0,
          width: parseFloat(dim.width) || 0,
          height: parseFloat(dim.height) || 0,
          noOfPackets: parseFloat(dim.noOfPackets) || 0,
          weightOfPackets: parseFloat(dim.weightOfPackets) || 0,
        }))
      : [];

    // ✅ MANUAL: User enters actual road distance (not calculated)
    const distance = parseFloat(req.body.distance) || 0;

    // 3. Create Docket with Consignor, Consignee references and Dimensions array
    const docketData = new Docket({
      docketNo,
      bookingDate: parseDate(bookingDate),
      destinationCity,
      postalCode,
      expectedDelivery: parseDate(expectedDelivery),
      consignor: consignorId,
      consignee: consigneeId,
      dimensions: processedDimensions,
      isAutoGenerated: isAutoGenerated || false,
      distance: distance, // ✅ NEW: Store distance
    });

    const savedDocket = await docketData.save();

    // 4. Create BookingInfo
    const bookingInfoData = new BookingInfo({
      docketId: savedDocket._id,
      customerType,
      bookingMode,
      originCity,
      billingParty,
      billingAt,
      bookingType,
      deliveryMode,
      loadType,
      gstinNo,
    });

    const savedBookingInfo = await bookingInfoData.save();

    // 5. Create Invoice
    let invoiceId = null;
    if (invNo) {
      // ✅ MANUAL: User enters E-way Bill expiry date (not calculated)
      const eWayBillExpiry = parseDate(req.body.eWayBillExpiry);

      const invoiceData = new Invoice({
        eWayBill,
        invoiceNo: invNo,
        invoiceDate: parseDate(invDate),
        partNo,
        itemDescription: itemDesc,
        weight: parseFloat(weight) || 0,
        packet: parseFloat(packet) || 0,
        netInvoiceValue: parseFloat(netInvValue) || 0,
        grossInvoiceValue: parseFloat(gInvValue) || 0,
        docket: savedDocket._id,
        bookingInfo: savedBookingInfo._id,
        consignor: consignorId,
        consignee: consigneeId,
        eWayBillExpiry: eWayBillExpiry, // ✅ NEW: Store expiry date h
      });

      const savedInvoice = await invoiceData.save();
      invoiceId = savedInvoice._id;
    }

    res.status(201).json({
      success: true,
      message: "Docket created successfully with all details",
      data: {
        docket: savedDocket,
        bookingInfo: savedBookingInfo,
        consignor: consignorId,
        consignee: consigneeId,
        invoice: invoiceId,
      },
    });
  } catch (error) {
    console.error("Error creating docket:", error);
    // MongoDB duplicate key error (E11000) — safety net in case of race condition
    if (error.code === 11000 && error.keyPattern?.docketNo) {
      return res.status(409).json({
        success: false,
        message: `Docket No. "${error.keyValue?.docketNo}" already exists. Please use a unique docket number.`,
        field: "docketNo",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create docket",
    });
  }
};

export const getDocketWithDetails = async (req, res) => {
  try {
    const { docketId } = req.params;

    // Populate consignor and consignee
    const docket = await Docket.findById(docketId)
      .populate("consignor")
      .populate("consignee");

    if (!docket) {
      return res.status(404).json({
        success: false,
        message: "Docket not found",
      });
    }

    const bookingInfo = await BookingInfo.findOne({ docketId });
    const invoice = await Invoice.findOne({ docket: docketId })
      .populate("consignor")
      .populate("consignee");

    res.status(200).json({
      success: true,
      data: {
        docket,
        bookingInfo,
        invoice,
      },
    });
  } catch (error) {
    console.error("Error fetching docket:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch docket",
    });
  }
};

export const getAllDockets = async (req, res) => {
  try {
    const Activity = (await import("../models/Activity.js")).default;

    // 1. Fetch all dockets with populated refs — ONE query
    const dockets = await Docket.find()
      .populate("consignor")
      .populate("consignee")
      .lean();

    if (dockets.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const docketIds = dockets.map((d) => d._id);

    // 2. Bulk-fetch all BookingInfos — ONE query (replaces N findOne calls)
    const bookingInfos = await BookingInfo.find({ docketId: { $in: docketIds } }).lean();
    const bookingInfoMap = {};
    bookingInfos.forEach((b) => {
      bookingInfoMap[b.docketId.toString()] = b;
    });

    // 3. Bulk-fetch all Invoices — ONE query (replaces N findOne calls)
    const invoices = await Invoice.find({ docket: { $in: docketIds } }).lean();
    const invoiceMap = {};
    invoices.forEach((inv) => {
      invoiceMap[inv.docket.toString()] = inv;
    });

    // 4. Bulk-fetch latest activity per docket via aggregation — ONE query
    // (replaces 184 separate activityAPI.getByDocket() calls from TotalBooking.jsx)
    const latestActivities = await Activity.aggregate([
      { $match: { docketId: { $in: docketIds } } },
      { $sort: { date: -1, time: -1 } },
      {
        $group: {
          _id: "$docketId",
          status: { $first: "$status" },
        },
      },
    ]);
    const activityMap = {};
    latestActivities.forEach((a) => {
      activityMap[a._id.toString()] = a.status;
    });

    // 5. Assemble final response — zero extra DB calls
    const docketsWithDetails = dockets.map((docket) => {
      const id = docket._id.toString();
      return {
        docket,
        bookingInfo: bookingInfoMap[id] || null,
        invoice: invoiceMap[id] || null,
        latestStatus: activityMap[id] || null,
      };
    });

    res.status(200).json({
      success: true,
      data: docketsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching dockets:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch dockets",
    });
  }
};

export const updateDocketWithDetails = async (req, res) => {
  try {
    const { docketId } = req.params;
    const updateData = req.body;

    // Update Docket
    const docketUpdates = {};
    if (updateData.docketNo !== undefined) docketUpdates.docketNo = updateData.docketNo;
    if (updateData.bookingDate !== undefined) docketUpdates.bookingDate = parseDate(updateData.bookingDate);
    if (updateData.destinationCity !== undefined) docketUpdates.destinationCity = updateData.destinationCity;
    if (updateData.location !== undefined) docketUpdates.location = updateData.location;
    if (updateData.postalCode !== undefined) docketUpdates.postalCode = updateData.postalCode;
    if (updateData.expectedDelivery !== undefined) docketUpdates.expectedDelivery = parseDate(updateData.expectedDelivery);
    if (updateData.distance !== undefined) docketUpdates.distance = updateData.distance; // ✅ Handle distance field
    if (updateData.coLoader !== undefined) docketUpdates.coLoader = updateData.coLoader; // ✅ Handle coLoader field

    // Handle dimensions array
    if (updateData.dimensions && Array.isArray(updateData.dimensions)) {
      docketUpdates.dimensions = updateData.dimensions.map(dim => ({
        length: parseFloat(dim.length) || 0,
        width: parseFloat(dim.width) || 0,
        height: parseFloat(dim.height) || 0,
        noOfPackets: parseFloat(dim.noOfPackets) || 0,
        weightOfPackets: parseFloat(dim.weightOfPackets) || 0,
      }));
    }

    // Populate consignor and consignee
    const updatedDocket = await Docket.findByIdAndUpdate(docketId, docketUpdates, { new: true })
      .populate("consignor")
      .populate("consignee");

    // Update BookingInfo (only fields that exist in BookingInfo schema)
    const bookingUpdates = {};
    if (updateData.customerType !== undefined) bookingUpdates.customerType = updateData.customerType;
    if (updateData.bookingMode !== undefined) bookingUpdates.bookingMode = updateData.bookingMode;
    if (updateData.originCity !== undefined) bookingUpdates.originCity = updateData.originCity;
    if (updateData.billingParty !== undefined) bookingUpdates.billingParty = updateData.billingParty;
    if (updateData.billingAt !== undefined) bookingUpdates.billingAt = updateData.billingAt;
    if (updateData.bookingType !== undefined) bookingUpdates.bookingType = updateData.bookingType;
    if (updateData.deliveryMode !== undefined) bookingUpdates.deliveryMode = updateData.deliveryMode;
    if (updateData.loadType !== undefined) bookingUpdates.loadType = updateData.loadType;
    if (updateData.gstinNo !== undefined) bookingUpdates.gstinNo = updateData.gstinNo;

    const updatedBookingInfo = await BookingInfo.findOneAndUpdate(
      { docketId },
      bookingUpdates,
      { new: true, upsert: true }
    );
    
    // ================= UPDATE CONSIGNOR =================
    if (updatedDocket?.consignor?._id) {
      await Consignor.findByIdAndUpdate(
        updatedDocket.consignor._id,
        {
          isTemporary: updateData.isTemporaryConsignor,
          consignorName: updateData.consignor,
          address: updateData.consignorAddress,
          city: updateData.consignorCity,
          state: updateData.consignorState,
          pin: updateData.consignorPin,
          phone: updateData.consignorPhone,
          crgstinNo: updateData.crgstinNo,
        }
      );
    }

    // ================= UPDATE CONSIGNEE =================
    if (updatedDocket?.consignee?._id) {
      await Consignee.findByIdAndUpdate(
        updatedDocket.consignee._id,
        {
          isTemporary: updateData.isTemporaryConsignee,
          consigneeName: updateData.consignee,
          address: updateData.consigneeAddress,
          city: updateData.consigneeCity,
          state: updateData.consigneeState,
          pin: updateData.consigneePin,
          phone: updateData.consigneePhone,
          cegstinNo: updateData.cegstinNo,
        }
      );
    }

    // Update Invoice - always run if any invoice field is present
    let updatedInvoice = null;
    if (updateData.invNo !== undefined) {
      const invoiceUpdates = {};
      if (updateData.eWayBill !== undefined) invoiceUpdates.eWayBill = updateData.eWayBill;
      if (updateData.eWayBillExpiry !== undefined) invoiceUpdates.eWayBillExpiry = parseDate(updateData.eWayBillExpiry);
      if (updateData.invNo !== undefined) invoiceUpdates.invoiceNo = updateData.invNo || "N/A";
      if (updateData.invDate !== undefined) invoiceUpdates.invoiceDate = parseDate(updateData.invDate);
      if (updateData.partNo !== undefined) invoiceUpdates.partNo = updateData.partNo;
      if (updateData.itemDesc !== undefined) invoiceUpdates.itemDescription = updateData.itemDesc;
      if (updateData.weight !== undefined) invoiceUpdates.weight = parseFloat(updateData.weight);
      if (updateData.packet !== undefined) invoiceUpdates.packet = parseFloat(updateData.packet);
      if (updateData.netInvValue !== undefined) invoiceUpdates.netInvoiceValue = parseFloat(updateData.netInvValue);
      if (updateData.gInvValue !== undefined) invoiceUpdates.grossInvoiceValue = parseFloat(updateData.gInvValue);

      updatedInvoice = await Invoice.findOneAndUpdate(
        { docket: docketId },
        { $set: invoiceUpdates },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Docket updated successfully",
      data: {
        docket: updatedDocket,
        bookingInfo: updatedBookingInfo,
        invoice: updatedInvoice,
      },
    });
  } catch (error) {
    console.error("Error updating docket:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update docket",
    });
  }
};

export const deleteDocketWithDetails = async (req, res) => {
  try {
    const { docketId } = req.params;

    // Delete related documents
    await BookingInfo.deleteMany({ docketId });
    await Invoice.deleteMany({ docket: docketId });
    await Docket.findByIdAndDelete(docketId);

    res.status(200).json({
      success: true,
      message: "Docket and related details deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting docket:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete docket",
    });
  }
};

// ✅ Toggle RTO (Return to Origin) status for a docket
export const toggleRto = async (req, res) => {
  try {
    const { id } = req.params;
    const { rto } = req.body;

    // ✅ Use findByIdAndUpdate to update only RTO field without triggering full validation
    const docket = await Docket.findByIdAndUpdate(
      id,
      { rto: rto },
      { new: true, runValidators: false } // new: true returns updated doc, runValidators: false skips validation
    );

    if (!docket) {
      return res.status(404).json({
        success: false,
        message: "Docket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `RTO ${rto ? 'enabled' : 'disabled'} successfully`,
      data: {
        docketId: docket._id,
        docketNo: docket.docketNo,
        rto: docket.rto,
              docketStatus: docket.docketStatus,
      },
    });
  } catch (error) {
    console.error("Error toggling RTO:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle RTO",
    });
  }
};
// ========================================================================
// ✅ NEW: Status-Based Filtering Functions
// ========================================================================

/**
 * @desc    Get all delivered dockets
 * @route   GET /api/v1/dockets/delivered
 * @access  Public
 */
export const getDeliveredDockets = async (req, res) => {
  try {
    // Import Activity model (ensure it's imported at the top)
    const Activity = (await import("../models/Activity.js")).default;
    
    // Get all active (non-cancelled) dockets
    const dockets = await Docket.find({ docketStatus: { $ne: 'Cancelled' } })
      .populate("consignor")
      .populate("consignee")
      .lean();

    // Get all BookingInfo to fetch originCity
    const bookingInfos = await BookingInfo.find().lean();
    const bookingInfoByDocket = {};
    bookingInfos.forEach((info) => {
      bookingInfoByDocket[info.docketId.toString()] = info;
    });

    // Get all activities
    const activities = await Activity.find()
      .sort({ date: -1, time: -1 })
      .lean();

    // Group activities by docketId
    const activitiesByDocket = {};
    activities.forEach((activity) => {
      const docketId = activity.docketId.toString();
      if (!activitiesByDocket[docketId]) {
        activitiesByDocket[docketId] = [];
      }
      activitiesByDocket[docketId].push(activity);
    });

    // Filter and format delivered dockets
    const deliveredDockets = [];
    
    for (const docket of dockets) {
      const docketActivities = activitiesByDocket[docket._id.toString()] || [];
      const bookingInfo = bookingInfoByDocket[docket._id.toString()];
      
      if (docketActivities.length > 0) {
        // Get latest activity (already sorted)
        const latestActivity = docketActivities[0];
        const status = latestActivity.status.toLowerCase().trim();
        
        // Check if delivered (handles "Delivered", "(RTO) Delivered", etc.)
        // But exclude "Undelivered"
        if (status.includes("delivered") && !status.includes("undelivered")) {
          deliveredDockets.push({
            docket: {
              _id: docket._id,
              docketNo: docket.docketNo,
              bookingDate: docket.bookingDate,
              expectedDeliveryDate: docket.expectedDelivery,
              destinationCity: docket.destinationCity,
              consignor: docket.consignor,
              consignee: docket.consignee,
              rto: docket.rto,
              docketStatus: docket.docketStatus,
            },
            bookingInfo: {
              originCity: bookingInfo?.originCity || docket.destinationCity,
            },
            activities: docketActivities,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      count: deliveredDockets.length,
      data: deliveredDockets,
    });
  } catch (error) {
    console.error("❌ Error fetching delivered dockets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching delivered dockets",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all undelivered dockets
 * @route   GET /api/v1/dockets/undelivered
 * @access  Public
 */
export const getUndeliveredDockets = async (req, res) => {
  try {
    const Activity = (await import("../models/Activity.js")).default;
    
    const dockets = await Docket.find({ docketStatus: { $ne: 'Cancelled' } })
      .populate("consignor")
      .populate("consignee")
      .lean();

    // Get all BookingInfo to fetch originCity
    const bookingInfos = await BookingInfo.find().lean();
    const bookingInfoByDocket = {};
    bookingInfos.forEach((info) => {
      bookingInfoByDocket[info.docketId.toString()] = info;
    });

    const activities = await Activity.find()
      .sort({ date: -1, time: -1 })
      .lean();

    const activitiesByDocket = {};
    activities.forEach((activity) => {
      const docketId = activity.docketId.toString();
      if (!activitiesByDocket[docketId]) {
        activitiesByDocket[docketId] = [];
      }
      activitiesByDocket[docketId].push(activity);
    });

    const undeliveredDockets = [];
    
    for (const docket of dockets) {
      const docketActivities = activitiesByDocket[docket._id.toString()] || [];
      const bookingInfo = bookingInfoByDocket[docket._id.toString()];
      
      if (docketActivities.length > 0) {
        const latestActivity = docketActivities[0];
        const status = latestActivity.status.toLowerCase().trim();
        
        // Check if status contains "undelivered"
        if (status.includes("undelivered")) {
          undeliveredDockets.push({
            docket: {
              _id: docket._id,
              docketNo: docket.docketNo,
              bookingDate: docket.bookingDate,
              expectedDeliveryDate: docket.expectedDelivery,
              destinationCity: docket.destinationCity,
              consignor: docket.consignor,
              consignee: docket.consignee,
              rto: docket.rto,
              docketStatus: docket.docketStatus,
            },
            bookingInfo: {
              originCity: bookingInfo?.originCity || docket.destinationCity,
            },
            activities: docketActivities,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      count: undeliveredDockets.length,
      data: undeliveredDockets,
    });
  } catch (error) {
    console.error("❌ Error fetching undelivered dockets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching undelivered dockets",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all pending dockets (not delivered or undelivered)
 * @route   GET /api/v1/dockets/pending
 * @access  Public
 */
export const getPendingDockets = async (req, res) => {
  try {
    const Activity = (await import("../models/Activity.js")).default;
    
    const dockets = await Docket.find({ docketStatus: { $ne: 'Cancelled' } })
      .populate("consignor")
      .populate("consignee")
      .lean();

    // Get all BookingInfo to fetch originCity
    const bookingInfos = await BookingInfo.find().lean();
    const bookingInfoByDocket = {};
    bookingInfos.forEach((info) => {
      bookingInfoByDocket[info.docketId.toString()] = info;
    });

    const activities = await Activity.find()
      .sort({ date: -1, time: -1 })
      .lean();

    const activitiesByDocket = {};
    activities.forEach((activity) => {
      const docketId = activity.docketId.toString();
      if (!activitiesByDocket[docketId]) {
        activitiesByDocket[docketId] = [];
      }
      activitiesByDocket[docketId].push(activity);
    });

    const pendingDockets = [];
    
    for (const docket of dockets) {
      const docketActivities = activitiesByDocket[docket._id.toString()] || [];
      const bookingInfo = bookingInfoByDocket[docket._id.toString()];
      
      let isPending = false;
      
      if (docketActivities.length === 0) {
        // No activities = pending
        isPending = true;
      } else {
        const latestActivity = docketActivities[0];
        const status = latestActivity.status.toLowerCase().trim();
        
        // Pending if NOT delivered and NOT undelivered
        const isDelivered = status.includes("delivered") && !status.includes("undelivered");
        const isUndelivered = status.includes("undelivered");
        
        isPending = !isDelivered && !isUndelivered;
      }
      
      if (isPending) {
        pendingDockets.push({
          docket: {
            _id: docket._id,
            docketNo: docket.docketNo,
            bookingDate: docket.bookingDate,
            expectedDeliveryDate: docket.expectedDelivery,
            destinationCity: docket.destinationCity,
            consignor: docket.consignor,
            consignee: docket.consignee,
            rto: docket.rto,
              docketStatus: docket.docketStatus,
          },
          bookingInfo: {
            originCity: bookingInfo?.originCity || docket.destinationCity,
          },
          activities: docketActivities,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: pendingDockets.length,
      data: pendingDockets,
    });
  } catch (error) {
    console.error("❌ Error fetching pending dockets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending dockets",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all RTO (Return to Origin) dockets
 * @route   GET /api/v1/dockets/rto
 * @access  Public
 */
export const getRTODockets = async (req, res) => {
  try {
    const Activity = (await import("../models/Activity.js")).default;
    
    const dockets = await Docket.find({ docketStatus: { $ne: 'Cancelled' } })
      .populate("consignor")
      .populate("consignee")
      .lean();

    // Get all BookingInfo to fetch originCity
    const bookingInfos = await BookingInfo.find().lean();
    const bookingInfoByDocket = {};
    bookingInfos.forEach((info) => {
      bookingInfoByDocket[info.docketId.toString()] = info;
    });

    const activities = await Activity.find()
      .sort({ date: -1, time: -1 })
      .lean();

    const activitiesByDocket = {};
    activities.forEach((activity) => {
      const docketId = activity.docketId.toString();
      if (!activitiesByDocket[docketId]) {
        activitiesByDocket[docketId] = [];
      }
      activitiesByDocket[docketId].push(activity);
    });

    const rtoDockets = [];
    
    for (const docket of dockets) {
      const docketActivities = activitiesByDocket[docket._id.toString()] || [];
      const bookingInfo = bookingInfoByDocket[docket._id.toString()];
      
      // Check if docket has RTO flag
      const hasRTOFlag = docket.rto === true;
      
      // Check if any activity has RTO in status
      let hasRTOActivity = false;
      if (docketActivities.length > 0) {
        // Check any activity, not just the latest
        hasRTOActivity = docketActivities.some(activity => {
          const status = activity.status.toLowerCase().trim();
          return status.includes("(rto)") || 
                 status.includes("rto") || 
                 status.includes("return to origin") ||
                 status.includes("return to sender");
        });
      }
      
      if (hasRTOFlag || hasRTOActivity) {
        rtoDockets.push({
          docket: {
            _id: docket._id,
            docketNo: docket.docketNo,
            bookingDate: docket.bookingDate,
            expectedDeliveryDate: docket.expectedDelivery,
            destinationCity: docket.destinationCity,
            consignor: docket.consignor,
            consignee: docket.consignee,
            rto: docket.rto,
              docketStatus: docket.docketStatus,
          },
          bookingInfo: {
            originCity: bookingInfo?.originCity || docket.destinationCity,
          },
          activities: docketActivities,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: rtoDockets.length,
      data: rtoDockets,
    });
  } catch (error) {
    console.error("❌ Error fetching RTO dockets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching RTO dockets",
      error: error.message,
    });
  }
};

/**
 * @desc    Search dockets by docketNo, city, consignor name, consignee name
 * @route   GET /api/v1/dockets/search?q=<query>
 * @access  Public
 */
export const searchDockets = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    // 1. Search dockets by docketNo or destinationCity — hits indexes
    const dockets = await Docket.find({
      docketStatus: { $ne: "Cancelled" },
      $or: [
        { docketNo: searchRegex },
        { destinationCity: searchRegex },
      ],
    })
      .populate("consignor")
      .populate("consignee")
      .limit(20)
      .lean();

    // 2. Also search by consignor/consignee name in their own collections
    const [matchingConsignors, matchingConsignees] = await Promise.all([
      Consignor.find({ consignorName: searchRegex }, "_id").lean(),
      Consignee.find({ consigneeName: searchRegex }, "_id").lean(),
    ]);

    const consignorIds = matchingConsignors.map((c) => c._id);
    const consigneeIds = matchingConsignees.map((c) => c._id);

    let extraDockets = [];
    if (consignorIds.length > 0 || consigneeIds.length > 0) {
      const orClauses = [];
      if (consignorIds.length > 0) orClauses.push({ consignor: { $in: consignorIds } });
      if (consigneeIds.length > 0) orClauses.push({ consignee: { $in: consigneeIds } });

      extraDockets = await Docket.find({
        docketStatus: { $ne: "Cancelled" },
        $or: orClauses,
      })
        .populate("consignor")
        .populate("consignee")
        .limit(20)
        .lean();
    }

    // 3. Merge and deduplicate
    const seen = new Set(dockets.map((d) => d._id.toString()));
    const allDockets = [...dockets];
    for (const d of extraDockets) {
      if (!seen.has(d._id.toString())) {
        allDockets.push(d);
        seen.add(d._id.toString());
      }
    }

    if (allDockets.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // 4. Bulk-fetch BookingInfos for matched dockets only
    const docketIds = allDockets.map((d) => d._id);
    const bookingInfos = await BookingInfo.find({ docketId: { $in: docketIds } }).lean();
    const bookingInfoMap = {};
    bookingInfos.forEach((b) => {
      bookingInfoMap[b.docketId.toString()] = b;
    });

    const result = allDockets.map((docket) => ({
      docket,
      bookingInfo: bookingInfoMap[docket._id.toString()] || null,
      invoice: null,
    }));

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error("❌ Search dockets error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * @desc    Get dockets with server-side pagination + filtering by day/month/year
 * @route   GET /api/v1/dockets/paginated?page=1&limit=8&month=3&year=2026&day=16
 * @access  Public
 */
export const getPaginatedDockets = async (req, res) => {
  try {
    const Activity = (await import("../models/Activity.js")).default;

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 8);
    const skip  = (page - 1) * limit;

    const { month, year, day } = req.query;

    // Build date filter if provided
    const docketFilter = {};
    if (year) {
      const y = parseInt(year);
      const m = month ? parseInt(month) - 1 : 0;       // month is 0-indexed in Date
      const d = day   ? parseInt(day)      : 1;
      const lastMonth = month ? parseInt(month) - 1 : 11;
      const lastDay   = day
        ? parseInt(day) + 1
        : new Date(y, lastMonth + 1, 0).getDate() + 1; // last day of month + 1

      if (day && month) {
        // Exact day filter
        docketFilter.bookingDate = {
          $gte: new Date(y, m, d),
          $lt:  new Date(y, m, d + 1),
        };
      } else if (month) {
        // Exact month filter
        docketFilter.bookingDate = {
          $gte: new Date(y, m, 1),
          $lt:  new Date(y, m + 1, 1),
        };
      } else {
        // Exact year filter
        docketFilter.bookingDate = {
          $gte: new Date(y, 0, 1),
          $lt:  new Date(y + 1, 0, 1),
        };
      }
    }

    // Exclude cancelled dockets
    docketFilter.docketStatus = { $ne: "Cancelled" };

    // Run count + page fetch in parallel
    const [totalCount, dockets] = await Promise.all([
      Docket.countDocuments(docketFilter),
      Docket.find(docketFilter)
        .populate("consignor")
        .populate("consignee")
        .sort({ bookingDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    if (dockets.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) },
      });
    }

    const docketIds = dockets.map((d) => d._id);

    // Bulk fetch only for this page's dockets
    const [bookingInfos, invoices, latestActivities] = await Promise.all([
      BookingInfo.find({ docketId: { $in: docketIds } }).lean(),
      Invoice.find({ docket: { $in: docketIds } }).lean(),
      Activity.aggregate([
        { $match: { docketId: { $in: docketIds } } },
        { $sort: { date: -1, time: -1 } },
        { $group: { _id: "$docketId", status: { $first: "$status" } } },
      ]),
    ]);

    const bookingInfoMap = {};
    bookingInfos.forEach((b) => { bookingInfoMap[b.docketId.toString()] = b; });

    const invoiceMap = {};
    invoices.forEach((inv) => { invoiceMap[inv.docket.toString()] = inv; });

    const activityMap = {};
    latestActivities.forEach((a) => { activityMap[a._id.toString()] = a.status; });

    const data = dockets.map((docket) => {
      const id = docket._id.toString();
      return {
        docket,
        bookingInfo: bookingInfoMap[id] || null,
        invoice:     invoiceMap[id]     || null,
        latestStatus: activityMap[id]   || null,
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total:      totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching paginated dockets:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch dockets" });
  }
};

// ── POST /api/v1/dockets/:id/upload-mis-image ──
// Upload MIS receipt image to Cloudinary and save URL to docket
export const uploadMisImage = async (req, res) => {
  try {
    const { id } = req.params;

    // multer+cloudinary already uploaded the file — req.file has the result
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const misImageUrl       = req.file.path;       // Cloudinary secure URL
    const misImagePublicId  = req.file.filename;   // Cloudinary public_id (for future deletion)

    const docket = await Docket.findByIdAndUpdate(
      id,
      { misImageUrl, misImageDeleteHash: misImagePublicId },
      { new: true }
    );

    if (!docket) {
      // Cleanup uploaded image from Cloudinary if docket not found
      await cloudinary.uploader.destroy(misImagePublicId);
      return res.status(404).json({ success: false, message: "Docket not found" });
    }

    console.log(`✅ MIS image uploaded to Cloudinary for docket ${docket.docketNo}:`, misImageUrl);

    res.status(200).json({
      success: true,
      message: "MIS image uploaded successfully",
      data: { misImageUrl: docket.misImageUrl, misImagePublicId: docket.misImageDeleteHash },
    });
  } catch (error) {
    console.error("❌ Error uploading MIS image:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * @desc    MIS Report search — filter by consignor/consignee name,
 *          returns activities + invoice + co-loader in one shot
 * @route   GET /api/v1/dockets/mis-search?clientType=Consignor&clientName=ABC
 * @access  Public
 */
export const misSearch = async (req, res) => {
  try {
    const Activity = (await import("../models/Activity.js")).default;
    const CoLoader = (await import("../models/Coloader.js")).default;

    const { clientType, clientName } = req.query;

    if (!clientName?.trim()) {
      return res.status(400).json({ success: false, message: "clientName is required" });
    }

    // Normalize: trim + collapse multiple spaces (matches even if DB has extra spaces)
    const normalizedName = clientName.trim().replace(/\s+/g, "\\s+");
    const searchRegex = new RegExp(normalizedName, "i");

    // 1. Find matching consignor/consignee IDs first
    let docketQuery = { docketStatus: { $ne: "Cancelled" } };

    if (clientType === "Consignor") {
      const matches = await Consignor.find({ consignorName: searchRegex }, "_id").lean();
      if (matches.length === 0) return res.status(200).json({ success: true, count: 0, data: [] });
      docketQuery.consignor = { $in: matches.map((c) => c._id) };
    } else if (clientType === "Consignee") {
      const matches = await Consignee.find({ consigneeName: searchRegex }, "_id").lean();
      if (matches.length === 0) return res.status(200).json({ success: true, count: 0, data: [] });
      docketQuery.consignee = { $in: matches.map((c) => c._id) };
    } else {
      return res.status(400).json({ success: false, message: "clientType must be Consignor or Consignee" });
    }

    // 2. Fetch only matched dockets (NOT all dockets)
    const dockets = await Docket.find(docketQuery)
      .populate("consignor")
      .populate("consignee")
      .lean();

    if (dockets.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const docketIds = dockets.map((d) => d._id);

    // 3. Bulk fetch everything in parallel — 4 queries total regardless of result count
    const [bookingInfos, invoices, latestActivities, coLoaders] = await Promise.all([
      BookingInfo.find({ docketId: { $in: docketIds } }).lean(),
      Invoice.find({ docket: { $in: docketIds } }).lean(),
      // Aggregation: get latest status + all activities per docket (for POD lookup)
      Activity.aggregate([
        { $match: { docketId: { $in: docketIds } } },
        { $sort: { date: -1, time: -1 } },
        {
          $group: {
            _id: "$docketId",
            status: { $first: "$status" },
            activities: { $push: { status: "$status", podImage: "$podImage" } },
          },
        },
      ]),
      CoLoader.find({ docketId: { $in: docketIds } }).lean(),
    ]);

    // Build lookup maps
    const bookingInfoMap = {};
    bookingInfos.forEach((b) => { bookingInfoMap[b.docketId.toString()] = b; });

    const invoiceMap = {};
    invoices.forEach((inv) => { invoiceMap[inv.docket.toString()] = inv; });

    const activityMap = {};
    latestActivities.forEach((a) => {
      const deliveredWithPod = a.activities.find(
        (act) => act.status === "Delivered" && act.podImage?.url
      );
      activityMap[a._id.toString()] = {
        status: a.status || "-",
        podUrl: deliveredWithPod?.podImage?.url || null,
      };
    });

    const coLoaderMap = {};
    coLoaders.forEach((cl) => {
      const did = cl.docketId?.toString();
      if (did) coLoaderMap[did] = cl;
    });

    // 4. Assemble — pure map, zero extra DB calls
    const result = dockets.map((docket) => {
      const id = docket._id.toString();
      const actInfo = activityMap[id] || { status: "-", podUrl: null };
      const cl = coLoaderMap[id] || null;

      return {
        docket,
        bookingInfo: bookingInfoMap[id] || null,
        invoice: invoiceMap[id] || null,
        latestStatus: actInfo.status,
        podUrl: actInfo.podUrl,
        coLoader: cl
          ? { transportName: cl.transportName || "-", transportDocket: cl.transportDocket || "-" }
          : null,
      };
    });

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error("❌ MIS search error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};