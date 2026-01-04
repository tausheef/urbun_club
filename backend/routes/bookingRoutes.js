import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

// Create new booking
router.post("/", createBooking);

// Get all bookings
router.get("/", getAllBookings);

// Get single booking by ID
router.get("/:id", getBookingById);

// Update booking
router.put("/:id", updateBooking);

// Delete booking
router.delete("/:id", deleteBooking);

export default router;
