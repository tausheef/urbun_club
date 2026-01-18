import mongoose from "mongoose";

const consignorSchema = new mongoose.Schema({
  isTemporary: { type: Boolean, default: false },
  consignorName: String,
  address: String,
  city: String,
  pin: String,
  state: String,
  phone: String,
  crgstinNo: String,
});

export default mongoose.model("Consignor", consignorSchema);
