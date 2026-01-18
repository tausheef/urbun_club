// controllers/authController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";

/**
 * Generate JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });
};

/**
 * Register new user (Email/Password)
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: "user", // Always create as user (admins are pre-created)
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

/**
 * Login user (Email/Password or Username/Password for admin)
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validate input
    if ((!email && !username) || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide credentials",
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

/**
 * Google OAuth Callback (handled by Passport)
 * This generates token after successful Google auth
 */
export const googleAuthCallback = async (req, res) => {
  try {
    // User is attached by Passport
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    // Generate token
    const token = generateToken(user._id);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
  } catch (error) {
    console.error("Google auth callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

/**
 * Get current logged-in user
 */
export const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get user",
    });
  }
};

/**
 * Logout user (client-side token removal)
 */
export const logoutUser = async (req, res) => {
  try {
    // With JWT, logout is handled client-side by removing token
    // This endpoint is just for confirmation
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};