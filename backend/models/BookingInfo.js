import mongoose from "mongoose";

const bookingInfoSchema = new mongoose.Schema(
  {
    docketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Docket",
      required: true,
    },
    customerType: { type: String, enum: ["Contractual Client", "Regular"], default: "Regular" },
    // ✅ UPDATED: Added enum validation for bookingMode
    bookingMode: { 
      type: String, 
      enum: ["ROAD", "AIR", "RAIL", "SEA"],
      default: "ROAD" 
    },
    origin: { type: String, required: true },
    originCity: { type: String },
    originLocation: { type: String },
    destinationBranch: { type: String },
    billingParty: { type: String },
    billingAt: { type: String },
    bookingType: { type: String },
    deliveryMode: { type: String },
    loadType: { type: String },
    gstinNo: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("BookingInfo", bookingInfoSchema);