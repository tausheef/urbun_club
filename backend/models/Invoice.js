import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    eWayBill: { type: String },
    invoiceNo: { type: String, required: true },
    invoiceDate: { type: Date },
    partNo: { type: String },
    itemDescription: { type: String },
    weight: { type: Number, default: 0 },
    packet: { type: Number, default: 0 },
    netInvoiceValue: { type: Number, default: 0 },
    grossInvoiceValue: { type: Number, default: 0 },
    docket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Docket",
    },
    bookingInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookingInfo",
    },
    consignor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consignor",
    },
    consignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consignee",
    },
    // ✅ NEW: E-way Bill expiry date
    eWayBillExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);