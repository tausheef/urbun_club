import mongoose from "mongoose";

const docketSchema = new mongoose.Schema(
  {
    docketNo: { type: String, required: true },
    bookingDate: { type: Date, required: true },
    destinationCity: { type: String, required: true },
    location: { type: String },
    postalCode: { type: String },
    expectedDelivery: { type: Date },
    // IMPORTANT: Add these two fields to link Docket to Consignor and Consignee
    consignor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consignor",
    },
    consignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consignee",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Docket", docketSchema);