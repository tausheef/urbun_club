import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";

// Import Routes
import invoiceRoutes from "./routes/invoiceRoutes.js";
import docketRoutes from "./routes/docketRoutes.js";
import consignorRoutes from "./routes/consignorRoutes.js";
import consigneeRoutes from "./routes/consigneeRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

// Load env variables
dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // React dev server
  credentials: true
}));
app.use(morgan("dev"));

// Base API route prefix (versioned)
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/dockets", docketRoutes);
app.use("/api/v1/consignors", consignorRoutes);
app.use("/api/v1/consignees", consigneeRoutes);
app.use("/api/v1/bookings", bookingRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("🚚 Logistics Management API is running...");
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler (optional)
app.use((err, req, res, next) => {
  console.error(`💥 Server Error: ${err.message}`);
  res.status(500).json({
    success: false,
    message: "Server Error",
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
