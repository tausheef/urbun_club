// Example: Updated ProofOfDelivery.jsx using new API utility
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { activityAPI } from "../utils/api";

export default function ProofOfDelivery() {
  const navigate = useNavigate();
  
  const [deliveredDockets, setDeliveredDockets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploadingDocketId, setUploadingDocketId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingActivityId, setDeletingActivityId] = useState(null); // ✅ Track which POD is being deleted

  useEffect(() => {
    fetchDeliveredDockets();
  }, []);

  const fetchDeliveredDockets = async () => {
    try {
      setLoading(true);
      const result = await activityAPI.getDelivered();

      if (result.success) {
        setDeliveredDockets(result.data);
        console.log("✅ Delivered dockets fetched:", result.data.length);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Error fetching delivered dockets:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch delivered dockets";
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Get the latest "Delivered" activity for a docket
  const getLatestDeliveredActivity = (activities) => {
    if (!activities || activities.length === 0) return null;

    // Filter for delivered activities (case-insensitive)
    const deliveredActivities = activities.filter(activity => {
      const status = activity.status.toLowerCase().trim();
      return status.includes("delivered") && !status.includes("undelivered");
    });

    // Return the latest one (already sorted by date/time desc)
    return deliveredActivities.length > 0 ? deliveredActivities[0] : null;
  };

  const handleFileSelect = (e, docketId) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("❌ Image must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("❌ Only JPG, PNG, and WebP images are allowed");
      return;
    }

    setSelectedFile(file);
    setUploadingDocketId(docketId);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPOD = async (activityId) => {
    if (!selectedFile || !activityId) {
      setMessage("❌ Please select an image first");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      console.log("📤 Uploading POD to activity:", activityId);

      const result = await activityAPI.uploadPOD(activityId, selectedFile);

      if (result.success) {
        setMessage("✅ POD image uploaded successfully!");
        setSelectedFile(null);
        setPreviewImage(null);
        setUploadingDocketId(null);
        
        // Refresh the list
        await fetchDeliveredDockets();
        
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Error uploading POD:", error);
      const errorMessage = error.response?.data?.message || "Failed to upload POD image";
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    setUploadingDocketId(null);
  };

  // ✅ IMPROVED: Delete POD image from activity with better error handling
  const handleDeletePOD = async (activityId, docketNo) => {
    // ✅ Validate activity ID before proceeding
    if (!activityId) {
      console.error("❌ No activity ID provided");
      setMessage("❌ Cannot delete POD: Invalid activity ID");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the POD image for docket ${docketNo}?`)) {
      return;
    }

    try {
      setDeletingActivityId(activityId); // ✅ Set deleting state
      setMessage("");

      console.log("🗑️ Deleting POD from activity:", activityId);

      const result = await activityAPI.deletePOD(activityId);

      console.log("Delete POD result:", result);

      if (result.success) {
        setMessage("✅ POD image deleted successfully!");
        
        // Refresh the list
        await fetchDeliveredDockets();
        
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting POD:", error);
      console.error("Error response:", error.response);
      const errorMessage = error.response?.data?.message || "Failed to delete POD image";
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setDeletingActivityId(null); // ✅ Clear deleting state
    }
  };

  // Filter dockets based on search query
  const filteredDockets = deliveredDockets.filter((item) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const docketNo = item.docket.docketNo?.toLowerCase() || "";
    const consigneeName = item.docket.consignee?.name?.toLowerCase() || "";
    const destinationCity = item.docket.destinationCity?.toLowerCase() || "";
    const latestActivity = getLatestDeliveredActivity(item.activities);
    const status = latestActivity?.status?.toLowerCase() || "";

    return (
      docketNo.includes(query) ||
      consigneeName.includes(query) ||
      destinationCity.includes(query) ||
      status.includes(query)
    );
  });

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">📸 Proof of Delivery</h1>
              <p className="text-blue-100 mt-1">
                Manage POD images for delivered dockets
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.includes("✅")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && !deletingActivityId && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by Docket No., Consignee, City, or Status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                Clear
              </button>
            )}
            <div className="text-sm text-gray-600">
              Showing <span className="font-bold">{filteredDockets.length}</span> of{" "}
              <span className="font-bold">{deliveredDockets.length}</span> dockets
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {filteredDockets.length}
              </p>
              <p className="text-gray-600 mt-1">
                {searchQuery ? "Matching Dockets" : "Total Delivered"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {filteredDockets.filter(item => {
                  const activity = getLatestDeliveredActivity(item.activities);
                  return activity?.podImage?.url;
                }).length}
              </p>
              <p className="text-gray-600 mt-1">With POD Image</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {filteredDockets.filter(item => {
                  const activity = getLatestDeliveredActivity(item.activities);
                  return !activity?.podImage?.url;
                }).length}
              </p>
              <p className="text-gray-600 mt-1">Missing POD Image</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Docket No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    POD Image
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDockets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? (
                        <div>
                          <p className="text-lg font-semibold">No dockets found matching "{searchQuery}"</p>
                          <button
                            onClick={handleClearSearch}
                            className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Clear search
                          </button>
                        </div>
                      ) : (
                        "No delivered dockets found"
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDockets.map((item) => {
                    const latestDeliveredActivity = getLatestDeliveredActivity(item.activities);
                    const hasPOD = latestDeliveredActivity?.podImage?.url;
                    const isUploading = uploadingDocketId === item.docket._id;
                    const isDeleting = deletingActivityId === latestDeliveredActivity?._id; // ✅ Check if this POD is being deleted

                    // ✅ Debug logging for missing activity IDs
                    if (!latestDeliveredActivity) {
                      console.warn("⚠️ No delivered activity found for docket:", item.docket.docketNo);
                    } else if (!latestDeliveredActivity._id) {
                      console.error("❌ Activity missing _id for docket:", item.docket.docketNo, latestDeliveredActivity);
                    }

                    return (
                      <tr key={item.docket._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.docket.docketNo}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.docket.consignee?.name || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.docket.destinationCity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {latestDeliveredActivity?.status || "Delivered"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {latestDeliveredActivity?.date
                            ? new Date(latestDeliveredActivity.date).toLocaleDateString("en-IN")
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasPOD ? (
                            // Show POD Image with Delete Icon
                            <div className="flex items-center gap-3">
                              <a
                                href={latestDeliveredActivity.podImage.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                              >
                                <img
                                  src={latestDeliveredActivity.podImage.url}
                                  alt="POD"
                                  className="w-20 h-20 object-cover rounded border-2 border-gray-300 hover:border-blue-500 cursor-pointer transition-all hover:scale-110"
                                />
                              </a>
                              <button
                                onClick={() => {
                                  // ✅ Additional validation before deletion
                                  if (!latestDeliveredActivity?._id) {
                                    console.error("❌ Cannot delete: Activity ID is missing");
                                    setMessage("❌ Cannot delete POD: Activity ID is missing");
                                    return;
                                  }
                                  handleDeletePOD(latestDeliveredActivity._id, item.docket.docketNo);
                                }}
                                disabled={isDeleting || !latestDeliveredActivity?._id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!latestDeliveredActivity?._id ? "Activity ID missing" : isDeleting ? "Deleting..." : "Delete POD Image"}
                              >
                                {isDeleting ? "⏳" : "🗑️"}
                              </button>
                            </div>
                          ) : isUploading && previewImage ? (
                            // Show Upload Preview & Confirm/Cancel
                            <div className="flex items-center gap-3">
                              <img
                                src={previewImage}
                                alt="Preview"
                                className="w-20 h-20 object-cover rounded border-2 border-blue-500"
                              />
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleUploadPOD(latestDeliveredActivity?._id)}
                                  disabled={loading || !latestDeliveredActivity?._id}
                                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded transition-colors disabled:bg-gray-400"
                                >
                                  ✓ Upload
                                </button>
                                <button
                                  onClick={cancelUpload}
                                  disabled={loading}
                                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded transition-colors disabled:bg-gray-400"
                                >
                                  ✕ Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Show Upload Button
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, item.docket._id)}
                                className="hidden"
                                id={`pod-upload-${item.docket._id}`}
                              />
                              <label
                                htmlFor={`pod-upload-${item.docket._id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded cursor-pointer transition-colors"
                              >
                                <span>📤</span>
                                <span>Upload POD</span>
                              </label>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}