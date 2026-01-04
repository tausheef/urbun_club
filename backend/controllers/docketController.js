// controllers/docketController.js
import Docket from "../models/Docket.js";
import BookingInfo from "../models/BookingInfo.js";
import Invoice from "../models/Invoice.js";
import Consignor from "../models/Consignor.js";
import Consignee from "../models/Consignee.js";

// Helper function to parse DD/MM/YYYY format
const parseDate = (dateString) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('/');
  if (!day || !month || !year) return null;
  return new Date(`${year}-${month}-${day}`);
};

export const createDocketWithDetails = async (req, res) => {
  try {
    const {
      // Docket fields
      docketNo,
      bookingDate,
      destinationCity,
      location,
      postalCode,
      expectedDelivery,
      
      // BookingInfo fields
      customerType,
      bookingMode,
      origin,
      originCity,
      originLocation,
      destinationBranch,
      billingParty,
      billingAt,
      bookingType,
      direction,
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
      consignorGSTIN,
      
      // Consignee fields
      isTemporaryConsignee,
      consignee,
      consigneeAddress,
      consigneeCity,
      consigneeState,
      consigneePin,
      consigneePhone,
      consigneeGSTIN,
    } = req.body;

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
        gstinNo: consignorGSTIN,
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
        gstinNo: consigneeGSTIN,
      });
      const savedConsignee = await consigneeData.save();
      consigneeId = savedConsignee._id;
    }

    // 3. Create Docket with Consignor and Consignee references
    const docketData = new Docket({
      docketNo,
      bookingDate: parseDate(bookingDate),
      destinationCity,
      location,
      postalCode,
      expectedDelivery: parseDate(expectedDelivery),
      consignor: consignorId,
      consignee: consigneeId,
    });

    const savedDocket = await docketData.save();

    // 4. Create BookingInfo
    const bookingInfoData = new BookingInfo({
      docketId: savedDocket._id,
      customerType,
      bookingMode,
      origin,
      originCity,
      originLocation,
      destinationBranch,
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
    // IMPORTANT: Populate consignor and consignee from Docket
    const dockets = await Docket.find()
      .populate("consignor")
      .populate("consignee");

    const docketsWithDetails = await Promise.all(
      dockets.map(async (docket) => {
        const bookingInfo = await BookingInfo.findOne({ docketId: docket._id });
        const invoice = await Invoice.findOne({ docket: docket._id })
          .populate("consignor")
          .populate("consignee");

        return {
          docket,
          bookingInfo,
          invoice,
        };
      })
    );

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

    // Populate consignor and consignee
    const updatedDocket = await Docket.findByIdAndUpdate(docketId, docketUpdates, { new: true })
      .populate("consignor")
      .populate("consignee");

    // Update BookingInfo
    const bookingUpdates = {};
    if (updateData.customerType !== undefined) bookingUpdates.customerType = updateData.customerType;
    if (updateData.bookingMode !== undefined) bookingUpdates.bookingMode = updateData.bookingMode;
    if (updateData.origin !== undefined) bookingUpdates.origin = updateData.origin;
    if (updateData.originCity !== undefined) bookingUpdates.originCity = updateData.originCity;
    if (updateData.originLocation !== undefined) bookingUpdates.originLocation = updateData.originLocation;
    if (updateData.destinationBranch !== undefined) bookingUpdates.destinationBranch = updateData.destinationBranch;
    if (updateData.billingParty !== undefined) bookingUpdates.billingParty = updateData.billingParty;
    if (updateData.billingAt !== undefined) bookingUpdates.billingAt = updateData.billingAt;
    if (updateData.bookingType !== undefined) bookingUpdates.bookingType = updateData.bookingType;
    if (updateData.deliveryMode !== undefined) bookingUpdates.deliveryMode = updateData.deliveryMode;
    if (updateData.loadType !== undefined) bookingUpdates.loadType = updateData.loadType;
    if (updateData.gstinNo !== undefined) bookingUpdates.gstinNo = updateData.gstinNo;

    const updatedBookingInfo = await BookingInfo.findOneAndUpdate(
      { docketId },
      bookingUpdates,
      { new: true }
    );

    // Update Invoice if invoice data is provided
    let updatedInvoice = null;
    if (updateData.invNo) {
      const invoiceUpdates = {};
      if (updateData.eWayBill !== undefined) invoiceUpdates.eWayBill = updateData.eWayBill;
      if (updateData.invNo !== undefined) invoiceUpdates.invoiceNo = updateData.invNo;
      if (updateData.invDate !== undefined) invoiceUpdates.invoiceDate = parseDate(updateData.invDate);
      if (updateData.partNo !== undefined) invoiceUpdates.partNo = updateData.partNo;
      if (updateData.itemDesc !== undefined) invoiceUpdates.itemDescription = updateData.itemDesc;
      if (updateData.weight !== undefined) invoiceUpdates.weight = parseFloat(updateData.weight);
      if (updateData.packet !== undefined) invoiceUpdates.packet = parseFloat(updateData.packet);
      if (updateData.netInvValue !== undefined) invoiceUpdates.netInvoiceValue = parseFloat(updateData.netInvValue);
      if (updateData.gInvValue !== undefined) invoiceUpdates.grossInvoiceValue = parseFloat(updateData.gInvValue);

      updatedInvoice = await Invoice.findOneAndUpdate(
        { docket: docketId },
        invoiceUpdates,
        { new: true }
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