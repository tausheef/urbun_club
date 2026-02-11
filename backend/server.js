import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import passport from "passport";
import connectDB from "./config/db.js";
import { configurePassport } from "./config/passport.js";

// Import Routes
import invoiceRoutes from "./routes/invoiceRoutes.js";
import docketRoutes from "./routes/docketRoutes.js"; // ✅ This now includes cancellation routes
import consignorRoutes from "./routes/consignorRoutes.js";
import consigneeRoutes from "./routes/consigneeRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import activityRoutes from "./routes/ActivityRoutes.js"; // ✅ Capital A
import ewayBillRoutes from "./routes/Ewaybillroutes.js"; // ✅ Fixed: Capital E, lowercase w-b-r
import authRoutes from "./routes/AuthRoutes.js"; // ✅ Capital A
import coLoaderRoutes from "./routes/coLoaderRoutes.js"; // ✅ Add co-loader routes

import path from "path";

// Load env variables
dotenv.config();

// Connect Database
connectDB();

// Configure Passport (Google OAuth)
configurePassport();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan("dev"));

// Initialize Passport
app.use(passport.initialize());

const __dirname = path.resolve();

// API Routes
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/dockets", docketRoutes); // ✅ Single mount - includes both regular and cancellation routes
app.use("/api/v1/consignors", consignorRoutes);
app.use("/api/v1/consignees", consigneeRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/ewaybills", ewayBillRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/coloaders", coLoaderRoutes); // ✅ Mount co-loader routes

// Production setup - serve static files if needed
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));
  
  // Only serve index.html for non-API routes using middleware
  app.use((req, res, next) => {
    // Skip if it's an API route
    if (req.path.startsWith('/api/')) {
      return next();
    }
    // Serve index.html for all other routes (SPA support)
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  // In development, show API message on root
  app.get("/", (req, res) => {
    res.send("🚚 Logistics Management API is running...");
  });
}

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
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