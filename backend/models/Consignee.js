import mongoose from "mongoose";

const consigneeSchema = new mongoose.Schema({
  isTemporary: { type: Boolean, default: false },
  consigneeName: String,
  address: String,
  city: String,
  pin: String,
  state: String,
  phone: String,
  cegstinNo: String,
});

export default mongoose.model("Consignee", consigneeSchema);
