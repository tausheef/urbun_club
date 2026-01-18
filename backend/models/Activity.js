import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    docketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Docket",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Booked",
        "In Transit",
        "Needing Appointment for Delivery",
        "Out for Delivery",
        "Delivered",
        "Undelivered",
      ],
    },
    location: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    // ✅ UPDATED: Single POD Image (not array)
    podImage: {
      url: {
        type: String, // Cloudinary URL
      },
      publicId: {
        type: String, // Cloudinary public_id (for deletion)
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);