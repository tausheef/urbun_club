// routes/authRoutes.js
import express from "express";
import passport from "passport";
import {
  registerUser,
  loginUser,
  googleAuthCallback,
  getMe,
  logoutUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Email/Password Authentication
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Get current user (protected route)
router.get("/me", protect, getMe);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false 
  }),
  googleAuthCallback
);

export default router;