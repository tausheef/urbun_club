import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function UpdateActivity() {
  const { id } = useParams(); // Docket ID
  const navigate = useNavigate();

  const [docketNo, setDocketNo] = useState("");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form data for new activity
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10), // Today's date
    time: new Date().toTimeString().slice(0, 5), // Current time HH:MM
    location: "",
    status: "",
  });

  // ✅ Single POD Image state
  const [podImage, setPodImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch docket and activities on mount
  useEffect(() => {
    fetchActivities();
  }, [id]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/activities/docket/${id}`);
      const result = await response.json();

      if (result.success) {
        setDocketNo(result.data.docketNo);
        setActivities(result.data.activities);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setMessage("❌ Failed to fetch activities");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Handle single POD image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("❌ Image must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage("❌ Only image files are allowed");
      return;
    }

    setPodImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  // ✅ Remove selected image
  const removeImage = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPodImage(null);
    setPreviewImage(null);
  };

  // Quick action buttons
  const handleDelivered = () => {
    setFormData((prev) => ({ ...prev, status: "Delivered" }));
  };

  const handleUndelivered = () => {
    setFormData((prev) => ({ ...prev, status: "Undelivered" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // ✅ Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("docketId", id);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("date", formData.date);
      formDataToSend.append("time", formData.time);

      // Append single POD image (if status is Delivered and image selected)
      if (formData.status === "Delivered" && podImage) {
        formDataToSend.append("podImage", podImage);
      }

      const response = await fetch("http://localhost:5000/api/v1/activities", {
        method: "POST",
        body: formDataToSend, // ✅ Send FormData (not JSON)
      });

      const result = await response.json();

      if (result.success) {
        setMessage("✅ Activity added successfully!");
        
        // Reset form
        setFormData({
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toTimeString().slice(0, 5),
          location: "",
          status: "",
        });

        // Reset POD image
        removeImage();

        // Refresh activities list
        fetchActivities();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/update-docket/${id}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Status emoji mapping
  const getStatusEmoji = (status) => {
    const emojiMap = {
      "Booked": "📦",
      "In Transit": "🚚",
      "Needing Appointment for Delivery": "📅",
      "Out for Delivery": "🚛",
      "Delivered": "✅",
      "Undelivered": "❌",
    };
    return emojiMap[status] || "📍";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🚚 Update Activity</h1>
              <p className="text-gray-600 mt-1">Docket No: <span className="font-semibold text-blue-600">{docketNo || id}</span></p>
            </div>
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("✅")
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
          >
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            📋 Activity Timeline
          </h2>
          
          {activities.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No activities yet</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="text-3xl">{getStatusEmoji(activity.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">{activity.status}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(activity.date)} • {activity.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      📍 {activity.location}
                    </p>
                    
                    {/* ✅ Display single POD Image */}
                    {activity.podImage && activity.podImage.url && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">📸 Proof of Delivery:</p>
                        <a
                          href={activity.podImage.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-32"
                        >
                          <img
                            src={activity.podImage.url}
                            alt="POD"
                            className="w-32 h-32 object-cover rounded border-2 border-gray-300 hover:border-blue-500 cursor-pointer transition-all hover:scale-105"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Activity Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            ➕ Add New Activity
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🕐 Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                placeholder="Enter location"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Status</option>
                <option value="In Transit">🚚 In Transit</option>
                <option value="Needing Appointment for Delivery">📅 Needing Appointment for Delivery</option>
                <option value="Out for Delivery">🚛 Out for Delivery</option>
                <option value="Delivered">✅ Delivered</option>
                <option value="Undelivered">❌ Undelivered</option>
              </select>
            </div>

            {/* Quick Action Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⚡ Quick Actions
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDelivered}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  ✅ Delivered
                </button>
                <button
                  type="button"
                  onClick={handleUndelivered}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  ❌ Undelivered
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                Quick action buttons will auto-fill the status dropdown above
              </p>
            </div>

            {/* ✅ POD Upload Section (Only shown when Delivered is selected) */}
            {formData.status === "Delivered" && (
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📸 Proof of Delivery (POD) - Optional
                </label>
                
                {/* File Input */}
                {!previewImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="pod-upload"
                    />
                    <label
                      htmlFor="pod-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-base text-gray-600 font-medium">
                        Click to upload POD image
                      </span>
                      <span className="text-sm text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </span>
                    </label>
                  </div>
                ) : (
                  /* Image Preview */
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="POD Preview"
                      className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                      title="Remove image"
                    >
                      ×
                    </button>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      {podImage?.name}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    💾 Submit Activity
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}