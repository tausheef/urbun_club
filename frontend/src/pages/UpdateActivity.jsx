import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { docketAPI, activityAPI } from "../utils/api";
import AutocompleteInput, { INDIAN_CITIES } from "../components/AutocompleteInput";

// ─── localStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = "urbanclub_custom_statuses";

const loadCustomStatuses = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveCustomStatus = (status) => {
  if (!status || !status.trim()) return;
  const trimmed = status.trim();
  try {
    const existing = loadCustomStatuses();
    // Don't save duplicates (case-insensitive)
    if (existing.some(s => s.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [trimmed, ...existing].slice(0, 30); // keep max 30
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full or unavailable — silent fail
  }
};
// ─────────────────────────────────────────────────────────────────────────────

export default function UpdateActivity() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [docketNo, setDocketNo] = useState("");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [rto, setRto] = useState(false);

  // ✅ Fixed statuses shown in dropdown
  const SUGGESTED_STATUSES = [
    "Booked",
    "In Transit",
    "Needing Appointment for Delivery",
    "Out for Delivery",
    "Delivered",
    "Undelivered",
    "Waiting at Warehouse",
    "Customs Clearance",
    "On Hold",
    "Return to Sender",
  ];

  const [isCustomStatus, setIsCustomStatus] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState("");

  // ✅ Combined suggestions: fixed statuses + previously typed custom statuses
  // Loaded fresh each time custom input opens so new saves appear immediately
  const [statusSuggestions, setStatusSuggestions] = useState([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    location: "",
    status: "",
  });

  const [podImage, setPodImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, [id]);

  const fetchActivities = async () => {
    try {
      const docketResult = await docketAPI.getById(id);
      if (docketResult.success && docketResult.data?.docket) {
        setDocketNo(docketResult.data.docket.docketNo);
        setRto(docketResult.data.docket.rto || false);
      }

      const result = await activityAPI.getByDocket(id);
      if (result.success) {
        setActivities(Array.isArray(result.data) ? result.data : []);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setMessage(`❌ ${error.response?.data?.message || error.message || "Failed to fetch activities"}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ When user picks "Custom Status" from dropdown
  const handleStatusChange = (e) => {
    const value = e.target.value;
    if (value === "__CUSTOM__") {
      // Load fresh suggestions: fixed + saved customs combined
      const saved = loadCustomStatuses();
      const combined = [
        ...SUGGESTED_STATUSES,
        ...saved.filter(s => !SUGGESTED_STATUSES.some(f => f.toLowerCase() === s.toLowerCase())),
      ];
      setStatusSuggestions(combined);
      setIsCustomStatus(true);
      setFormData(prev => ({ ...prev, status: customStatusInput }));
    } else {
      setIsCustomStatus(false);
      setCustomStatusInput("");
      setFormData(prev => ({ ...prev, status: value }));
    }
  };

  // ✅ Handle typing in custom status — uses AutocompleteInput's onChange pattern
  const handleCustomStatusChange = useCallback((e) => {
    const value = e.target.value;
    setCustomStatusInput(value);
    setFormData(prev => ({ ...prev, status: value }));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage("❌ Image must be less than 5MB");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("❌ Only JPG, PNG, and WebP images are allowed");
      return;
    }

    setPodImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPodImage(null);
    setPreviewImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("docketId", id);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("date", formData.date);
      formDataToSend.append("time", formData.time);
      if (podImage) formDataToSend.append("podImage", podImage);

      const result = await activityAPI.create(formDataToSend);

      if (result.success) {
        // ✅ Save custom status to localStorage only if it was a custom entry
        // (not one of the fixed suggested statuses)
        if (isCustomStatus && formData.status.trim()) {
          saveCustomStatus(formData.status.trim());
        }

        setMessage("✅ Activity added successfully!");
        setFormData({
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toTimeString().slice(0, 5),
          location: "",
          status: "",
        });
        setIsCustomStatus(false);
        setCustomStatusInput("");
        setPodImage(null);
        setPreviewImage(null);
        fetchActivities();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Error adding activity:", error);
      setMessage(`❌ ${error.response?.data?.message || error.message || "Failed to add activity"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelivered = () => {
    setIsCustomStatus(false);
    setCustomStatusInput("");
    setFormData((prev) => ({ ...prev, status: "Delivered" }));
  };

  const handleUndelivered = () => {
    setIsCustomStatus(false);
    setCustomStatusInput("");
    setFormData((prev) => ({ ...prev, status: "Undelivered" }));
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      const result = await activityAPI.delete(activityId);
      if (result.success) {
        setMessage("✅ Activity deleted successfully!");
        fetchActivities();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      setMessage(`❌ ${error.response?.data?.message || error.message || "Failed to delete activity"}`);
    }
  };

  const handleRtoToggle = async () => {
    try {
      const result = await docketAPI.toggleRto(id, !rto);
      if (result.success) {
        setRto(!rto);
        setMessage(`✅ RTO ${!rto ? 'enabled' : 'disabled'} successfully!`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Error toggling RTO:", error);
      setMessage(`❌ ${error.response?.data?.message || error.message || "Failed to toggle RTO"}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">📦 Update Activity</h1>
              <p className="text-blue-100 mt-1">
                Docket: <span className="font-semibold">{docketNo || "Loading..."}</span>
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

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes("✅")
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}>
            {message}
          </div>
        )}

        {/* Activity History */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              📋 Activity History
            </h2>
            <button
              onClick={handleRtoToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                rto
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <span className="text-lg">{rto ? '🔄' : '⭕'}</span>
              <span>RTO {rto ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No activities found. Add one below!</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {activity.status}
                        </span>
                        <span className="text-gray-600 text-sm">📍 {activity.location}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 {new Date(activity.date).toLocaleDateString("en-IN")}</span>
                        <span>🕐 {activity.time}</span>
                      </div>
                      {activity.podImage?.url && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-2">📸 Proof of Delivery:</p>
                          <a href={activity.podImage.url} target="_blank" rel="noopener noreferrer" className="block w-32">
                            <img
                              src={activity.podImage.url}
                              alt="POD"
                              className="w-32 h-32 object-cover rounded border-2 border-gray-300 hover:border-blue-500 cursor-pointer transition-all hover:scale-105"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(activity._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                      title="Delete activity"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            ➕ Add New Activity
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📅 Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🕐 Time</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Location — same AutocompleteInput as before */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📍 Location</label>
              <AutocompleteInput
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                suggestions={INDIAN_CITIES}
                placeholder="Enter location"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📊 Status</label>

              {!isCustomStatus ? (
                // ── Fixed dropdown ──────────────────────────────────────────
                <select
                  value={formData.status}
                  onChange={handleStatusChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  {SUGGESTED_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                  <option value="__CUSTOM__">✍️ Custom Status (Type Your Own)</option>
                </select>
              ) : (
                // ── Custom status with AutocompleteInput ────────────────────
                <div className="space-y-2">
                  <AutocompleteInput
                    name="customStatus"
                    value={customStatusInput}
                    onChange={handleCustomStatusChange}
                    suggestions={statusSuggestions}
                    placeholder="Type custom status... (previous entries shown as suggestions)"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomStatus(false);
                      setCustomStatusInput("");
                      setFormData(prev => ({ ...prev, status: "" }));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← Back to Suggestions
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {isCustomStatus
                  ? "Previously used custom statuses appear as suggestions as you type"
                  : "Select from suggestions or choose 'Custom Status' to type your own"}
              </p>
            </div>

            {/* Quick Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">⚡ Quick Actions</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDelivered}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  ✅ Delivered
                </button>
                <button
                  type="button"
                  onClick={handleUndelivered}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  ❌ Undelivered
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                Quick action buttons will auto-fill the status above
              </p>
            </div>

            {/* POD Image — only shown for Delivered */}
            {formData.status === "Delivered" && (
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📸 Proof of Delivery (POD) - Optional
                </label>
                {!previewImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="pod-upload"
                    />
                    <label htmlFor="pod-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-3xl">📷</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Click to upload POD image</p>
                      <p className="text-xs text-gray-500">JPG, PNG, WebP (Max 5MB)</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={previewImage}
                      alt="POD Preview"
                      className="w-48 h-48 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400"
            >
              {loading ? "Adding Activity..." : "➕ Add Activity"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}