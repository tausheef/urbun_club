import mongoose from "mongoose";

const docketCounterSchema = new mongoose.Schema(
  {
    _id: { 
      type: String, 
      default: "auto-docket-counter" 
    },
    lastNumber: { 
      type: Number, 
      default: 53220  // Starting from 53220, so first docket will be 53221
    },
    prefix: {
      type: String,
      default: "05"  // Prefix for docket numbers
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    timestamps: true 
  }
);

export default mongoose.model("DocketCounter", docketCounterSchema);