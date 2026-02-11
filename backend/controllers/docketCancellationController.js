// controllers/docketCancellationController.js
import Docket from '../models/Docket.js';

// @desc    Cancel a docket (soft delete)
// @route   PATCH /api/v1/dockets/:id/cancel
// @access  Private/Admin
export const cancelDocket = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id; // From auth middleware

    // Validate reason
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    // Find docket
    const docket = await Docket.findById(id);
    
    if (!docket) {
      return res.status(404).json({
        success: false,
        message: 'Docket not found'
      });
    }

    // Check if already cancelled
    if (docket.docketStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Docket is already cancelled'
      });
    }

    // Update docket status using findByIdAndUpdate (bypasses validation)
    const updatedDocket = await Docket.findByIdAndUpdate(
      id,
      {
        docketStatus: 'Cancelled',
        cancelledAt: new Date(),
        cancelledBy: adminId,
        cancellationReason: reason.trim()
      },
      { 
        new: true,
        runValidators: false // ✅ Skip validation for other fields
      }
    ).populate('cancelledBy', 'name username email');

    res.status(200).json({
      success: true,
      message: 'Docket cancelled successfully',
      data: {
        docketNo: updatedDocket.docketNo,
        docketStatus: updatedDocket.docketStatus,
        cancelledAt: updatedDocket.cancelledAt,
        cancelledBy: updatedDocket.cancelledBy,
        cancellationReason: updatedDocket.cancellationReason
      }
    });
  } catch (error) {
    console.error('Cancel docket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling docket',
      error: error.message
    });
  }
};

// @desc    Restore a cancelled docket
// @route   PATCH /api/v1/dockets/:id/restore
// @access  Private/Admin
export const restoreDocket = async (req, res) => {
  try {
    const { id } = req.params;

    // Find docket
    const docket = await Docket.findById(id);
    
    if (!docket) {
      return res.status(404).json({
        success: false,
        message: 'Docket not found'
      });
    }

    // Check if docket is cancelled
    if (docket.docketStatus !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled dockets can be restored'
      });
    }

    // Restore docket using findByIdAndUpdate
    const restoredDocket = await Docket.findByIdAndUpdate(
      id,
      {
        docketStatus: 'Active',
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: ''
      },
      { 
        new: true,
        runValidators: false // ✅ Skip validation
      }
    );

    res.status(200).json({
      success: true,
      message: 'Docket restored successfully',
      data: {
        docketNo: restoredDocket.docketNo,
        docketStatus: restoredDocket.docketStatus
      }
    });
  } catch (error) {
    console.error('Restore docket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while restoring docket',
      error: error.message
    });
  }
};

// @desc    Get all cancelled dockets
// @route   GET /api/v1/dockets/cancelled
// @access  Private/Admin
export const getCancelledDockets = async (req, res) => {
  try {
    const cancelledDockets = await Docket.find({ docketStatus: 'Cancelled' })
      .populate('consignor', 'consignorName')
      .populate('consignee', 'consigneeName')
      .populate('cancelledBy', 'name username email')
      .sort({ cancelledAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      count: cancelledDockets.length,
      data: cancelledDockets
    });
  } catch (error) {
    console.error('Get cancelled dockets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cancelled dockets',
      error: error.message
    });
  }
};