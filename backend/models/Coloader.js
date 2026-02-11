import mongoose from "mongoose";

const coLoaderSchema = new mongoose.Schema(
  {
    // Link to docket (one-to-one relationship)
    docketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Docket",
      required: true,
      unique: true, // ✅ One docket = One co-loader
    },
    
    // Transport company name
    transportName: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Transport company's docket number
    transportDocket: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Challan/Receipt image - NOW OPTIONAL
    challan: {
      url: {
        type: String, // Cloudinary URL
        required: false, // ✅ Made optional
      },
      publicId: {
        type: String, // Cloudinary public_id (for deletion)
        required: false, // ✅ Made optional
      },
    },
    
    // Track who created this
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CoLoader", coLoaderSchema);