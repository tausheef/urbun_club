// controllers/coLoaderController.js
import CoLoader from "../models/Coloader.js";
import Docket from "../models/Docket.js";
import cloudinary from "../config/cloudinary.js";

// @desc    Create new co-loader
// @route   POST /api/v1/coloaders
// @access  Private (Everyone)
export const createCoLoader = async (req, res) => {
  try {
    const { docketId, transportName, transportDocket } = req.body;
    const userId = req.user?._id; // From auth middleware

    // Validate required fields
    if (!docketId || !transportName || !transportDocket) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if docket exists
    const docket = await Docket.findById(docketId);
    if (!docket) {
      return res.status(404).json({
        success: false,
        message: "Docket not found",
      });
    }

    // Check if docket already has co-loader
    const existingCoLoader = await CoLoader.findOne({ docketId });
    if (existingCoLoader) {
      return res.status(400).json({
        success: false,
        message: "This docket already has a co-loader assigned",
      });
    }

    // ✅ Challan is now OPTIONAL
    const coLoaderData = {
      docketId,
      transportName,
      transportDocket,
      createdBy: userId,
    };

    // Add challan only if file was uploaded
    if (req.file) {
      coLoaderData.challan = {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename, // Cloudinary public_id
      };
    }

    // Create co-loader
    const coLoader = new CoLoader(coLoaderData);
    const savedCoLoader = await coLoader.save();

    // ✅ Update docket to mark it has co-loader
    await Docket.findByIdAndUpdate(docketId, { coLoader: true });

    // Populate docket info
    await savedCoLoader.populate("docketId", "docketNo bookingDate");

    res.status(201).json({
      success: true,
      message: "Co-loader created successfully",
      data: savedCoLoader,
    });
  } catch (error) {
    console.error("Create co-loader error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create co-loader",
    });
  }
};

// @desc    Get all co-loaders
// @route   GET /api/v1/coloaders
// @access  Private (Everyone)
export const getAllCoLoaders = async (req, res) => {
  try {
    const coLoaders = await CoLoader.find()
      .populate("docketId", "docketNo bookingDate destinationCity")
      .populate("docketId")
      .populate("createdBy", "name username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coLoaders.length,
      data: coLoaders,
    });
  } catch (error) {
    console.error("Get co-loaders error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch co-loaders",
    });
  }
};

// @desc    Get co-loader by ID
// @route   GET /api/v1/coloaders/:id
// @access  Private (Everyone)
export const getCoLoaderById = async (req, res) => {
  try {
    const { id } = req.params;

    const coLoader = await CoLoader.findById(id)
      .populate("docketId")
      .populate("createdBy", "name username email");

    if (!coLoader) {
      return res.status(404).json({
        success: false,
        message: "Co-loader not found",
      });
    }

    res.status(200).json({
      success: true,
      data: coLoader,
    });
  } catch (error) {
    console.error("Get co-loader error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch co-loader",
    });
  }
};

// @desc    Get co-loader by docket ID
// @route   GET /api/v1/coloaders/docket/:docketId
// @access  Private (Everyone)
export const getCoLoaderByDocketId = async (req, res) => {
  try {
    const { docketId } = req.params;

    const coLoader = await CoLoader.findOne({ docketId })
      .populate("docketId", "docketNo bookingDate destinationCity")
      .populate("createdBy", "name username email");

    if (!coLoader) {
      return res.status(404).json({
        success: false,
        message: "No co-loader found for this docket",
      });
    }

    res.status(200).json({
      success: true,
      data: coLoader,
    });
  } catch (error) {
    console.error("Get co-loader by docket error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch co-loader",
    });
  }
};

// @desc    Update co-loader
// @route   PUT /api/v1/coloaders/:id
// @access  Private (Admin only)
export const updateCoLoader = async (req, res) => {
  try {
    const { id } = req.params;
    const { transportName, transportDocket } = req.body;

    const coLoader = await CoLoader.findById(id);
    if (!coLoader) {
      return res.status(404).json({
        success: false,
        message: "Co-loader not found",
      });
    }

    // Update fields
    if (transportName) coLoader.transportName = transportName;
    if (transportDocket) coLoader.transportDocket = transportDocket;

    // Update challan image if new one uploaded
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (coLoader.challan?.publicId) {
        try {
          await cloudinary.uploader.destroy(coLoader.challan.publicId);
        } catch (error) {
          console.error("Error deleting old challan:", error);
        }
      }

      // Update with new image
      coLoader.challan = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const updatedCoLoader = await coLoader.save();
    await updatedCoLoader.populate("docketId", "docketNo bookingDate");

    res.status(200).json({
      success: true,
      message: "Co-loader updated successfully",
      data: updatedCoLoader,
    });
  } catch (error) {
    console.error("Update co-loader error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update co-loader",
    });
  }
};

// @desc    Delete co-loader
// @route   DELETE /api/v1/coloaders/:id
// @access  Private (Admin only)
export const deleteCoLoader = async (req, res) => {
  try {
    const { id } = req.params;

    const coLoader = await CoLoader.findById(id);
    if (!coLoader) {
      return res.status(404).json({
        success: false,
        message: "Co-loader not found",
      });
    }

    // Delete challan image from Cloudinary if it exists
    if (coLoader.challan?.publicId) {
      try {
        await cloudinary.uploader.destroy(coLoader.challan.publicId);
      } catch (error) {
        console.error("Error deleting challan:", error);
      }
    }

    await CoLoader.findByIdAndDelete(id);

    // ✅ Update docket to mark it no longer has co-loader
    await Docket.findByIdAndUpdate(coLoader.docketId, { coLoader: false });

    res.status(200).json({
      success: true,
      message: "Co-loader deleted successfully",
    });
  } catch (error) {
    console.error("Delete co-loader error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete co-loader",
    });
  }
};