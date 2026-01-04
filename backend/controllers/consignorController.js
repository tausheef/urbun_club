import Consignor from "../models/Consignor.js";

// Create a new Consignor
export const createConsignor = async (req, res) => {
  try {
    const newConsignor = new Consignor(req.body);
    const savedConsignor = await newConsignor.save();
    res.status(201).json(savedConsignor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Consignors
export const getAllConsignors = async (req, res) => {
  try {
    const consignors = await Consignor.find();
    res.status(200).json(consignors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single Consignor by ID
export const getConsignorById = async (req, res) => {
  try {
    const consignor = await Consignor.findById(req.params.id);
    if (!consignor) return res.status(404).json({ message: "Not found" });
    res.status(200).json(consignor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a Consignor
export const updateConsignor = async (req, res) => {
  try {
    const updatedConsignor = await Consignor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedConsignor) return res.status(404).json({ message: "Not found" });
    res.status(200).json(updatedConsignor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a Consignor
export const deleteConsignor = async (req, res) => {
  try {
    const deleted = await Consignor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Consignor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
