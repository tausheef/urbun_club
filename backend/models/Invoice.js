import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  eWayBill: String,
  invoiceNo: String,
  invoiceDate: Date,
  partNo: String,
  itemDescription: String,
  weight: Number,
  packet: Number,
  netInvoiceValue: Number,
  grossInvoiceValue: Number,
  docket: { type: mongoose.Schema.Types.ObjectId, ref: "Docket" },
  bookingInfo: { type: mongoose.Schema.Types.ObjectId, ref: "BookingInfo" },
  consignor: { type: mongoose.Schema.Types.ObjectId, ref: "Consignor" },
  consignee: { type: mongoose.Schema.Types.ObjectId, ref: "Consignee" },
});

export default mongoose.model("Invoice", invoiceSchema);
