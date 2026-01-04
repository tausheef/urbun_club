import Consignee from "../models/Consignee.js";

// Create a new Consignee
export const createConsignee = async (req, res) => {
  try {
    const newConsignee = new Consignee(req.body);
    const savedConsignee = await newConsignee.save();
    res.status(201).json(savedConsignee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Consignees
export const getAllConsignees = async (req, res) => {
  try {
    const consignees = await Consignee.find();
    res.status(200).json(consignees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single Consignee by ID
export const getConsigneeById = async (req, res) => {
  try {
    const consignee = await Consignee.findById(req.params.id);
    if (!consignee) return res.status(404).json({ message: "Not found" });
    res.status(200).json(consignee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a Consignee
export const updateConsignee = async (req, res) => {
  try {
    const updatedConsignee = await Consignee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedConsignee) return res.status(404).json({ message: "Not found" });
    res.status(200).json(updatedConsignee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a Consignee
export const deleteConsignee = async (req, res) => {
  try {
    const deleted = await Consignee.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Consignee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
