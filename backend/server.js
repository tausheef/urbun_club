import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import passport from "passport";
import connectDB from "./config/db.js";
import { configurePassport } from "./config/passport.js";
import path from "path";

import invoiceRoutes from "./routes/invoiceRoutes.js";
import docketRoutes from "./routes/docketRoutes.js";
import consignorRoutes from "./routes/consignorRoutes.js";
import consigneeRoutes from "./routes/consigneeRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import activityRoutes from "./routes/ActivityRoutes.js";
import ewayBillRoutes from "./routes/Ewaybillroutes.js";
import authRoutes from "./routes/AuthRoutes.js";
import coLoaderRoutes from "./routes/coLoaderRoutes.js";
import deliveryTrackerRoutes from "./routes/Deliverytrackerroutes.js";
import publicRoutes from "./routes/publicRoutes.js"; // ✅ NEW: Public tracking

dotenv.config();
connectDB();
configurePassport();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://urbanclub.co.in/erp',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(morgan("dev"));
app.use(passport.initialize());

const __dirname = path.resolve();

// API Routes (existing - unchanged)
app.use("/erp/api/v1/invoices", invoiceRoutes);
app.use("/erp/api/v1/dockets", docketRoutes);
app.use("/erp/api/v1/consignors", consignorRoutes);
app.use("/erp/api/v1/consignees", consigneeRoutes);
app.use("/erp/api/v1/bookings", bookingRoutes);
app.use("/erp/api/v1/activities", activityRoutes);
app.use("/erp/api/v1/ewaybills", ewayBillRoutes);
app.use("/erp/api/v1/auth", authRoutes);
app.use("/erp/api/v1/coloaders", coLoaderRoutes);
app.use("/erp/api/v1/delivery-tracker", deliveryTrackerRoutes);

// ✅ NEW: Public tracking route (no auth required)
app.use("/erp/api/v1/public", publicRoutes);

// Health check
app.get("/erp/api", (req, res) => res.json({ success: true, message: "🚚 Logistics Management API is running..." }));
app.get("/", (req, res) => res.json({ success: true, message: "🚚 Logistics Management API is running..." }));

// 404 Handler
app.use((req, res) => res.status(404).json({
  success: false,
  message: "Route not found",
}));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`💥 Server Error: ${err.message}`);
  res.status(500).json({ success: false, message: "Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));