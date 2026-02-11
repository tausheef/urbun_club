import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { coLoaderAPI } from '../utils/api';

export default function CoLoaderModify() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    transportName: '',
    transportDocket: '',
    challan: null,
  });

  const [coLoader, setCoLoader] = useState(null);
  const [challanPreview, setChallanPreview] = useState(null);
  const [existingChallan, setExistingChallan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch co-loader details on mount
  useEffect(() => {
    fetchCoLoaderDetails();
  }, [id]);

  const fetchCoLoaderDetails = async () => {
    try {
      setLoading(true);
      const response = await coLoaderAPI.getById(id);
      
      if (response.success && response.data) {
        const data = response.data;
        setCoLoader(data);
        
        // Pre-fill form with existing data
        setFormData({
          transportName: data.transportName || '',
          transportDocket: data.transportDocket || '',
          challan: null, // Don't pre-fill file input
        });

        // Set existing challan if available
        if (data.challan?.url) {
          setExistingChallan(data.challan.url);
        }
      } else {
        showMessage('error', 'Failed to load co-loader details');
        setTimeout(() => navigate('/coloader-bookings'), 2000);
      }
    } catch (error) {
      console.error('Error fetching co-loader:', error);
      showMessage('error', error.response?.data?.message || 'Failed to load co-loader details');
      setTimeout(() => navigate('/coloader-bookings'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle challan image upload
  const handleChallanChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Challan image must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('error', 'Only JPG, PNG, WebP images and PDF files are allowed');
      return;
    }

    setFormData(prev => ({ ...prev, challan: file }));

    // Create preview for images only
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChallanPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDFs, just show file name
      setChallanPreview('PDF');
    }
  };

  // Remove new challan image
  const handleRemoveNewChallan = () => {
    setFormData(prev => ({ ...prev, challan: null }));
    setChallanPreview(null);
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      // Validate required fields
      if (!formData.transportName.trim()) {
        showMessage('error', 'Please enter transport name');
        setUpdating(false);
        return;
      }

      if (!formData.transportDocket.trim()) {
        showMessage('error', 'Please enter transport docket');
        setUpdating(false);
        return;
      }

      // Update co-loader
      const response = await coLoaderAPI.update(id, formData);

      if (response.success) {
        showMessage('success', 'Co-Loader updated successfully!');
        
        // Navigate back after 2 seconds
        setTimeout(() => {
          navigate('/coloader-bookings');
        }, 2000);
      } else {
        showMessage('error', response.message || 'Failed to update co-loader');
      }
    } catch (error) {
      console.error('Update co-loader error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update co-loader');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="text-gray-600 mt-4">Loading co-loader details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!coLoader) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Co-Loader Not Found
            </h3>
            <button
              onClick={() => navigate('/coloader-bookings')}
              className="mt-4 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              ← Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">✏️ Modify Co-Loader</h1>
              <p className="text-blue-100 mt-1">
                Update transport details and upload receipt
              </p>
            </div>
            <button
              onClick={() => navigate('/coloader-bookings')}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Current Docket Info (Read-only) */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            🔒 Linked Docket (Cannot be changed)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Docket Number
              </label>
              <div className="text-lg font-semibold text-orange-600">
                {coLoader.docketId?.docketNo || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Destination
              </label>
              <div className="text-gray-900">
                {coLoader.docketId?.destinationCity || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Transport Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1️⃣ Transport Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="transportName"
                value={formData.transportName}
                onChange={handleInputChange}
                placeholder="Enter co-loader company name"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Transport Docket */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2️⃣ Transport Docket Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="transportDocket"
                value={formData.transportDocket}
                onChange={handleInputChange}
                placeholder="Enter co-loader's docket number"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Challan Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3️⃣ Challan / Receipt <span className="text-gray-400">(Optional)</span>
              </label>

              {/* Show existing challan if available */}
              {existingChallan && !challanPreview && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Current Receipt:
                  </div>
                  <div className="relative inline-block">
                    <img
                      src={existingChallan}
                      alt="Current Challan"
                      className="w-64 h-64 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Upload a new file below to replace this receipt
                    </div>
                  </div>
                </div>
              )}

              {/* Upload new challan */}
              {!challanPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleChallanChange}
                    className="hidden"
                    id="challan-upload"
                  />
                  <label
                    htmlFor="challan-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-3xl">📄</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {existingChallan 
                        ? 'Click to upload new challan image (optional)'
                        : 'Click to upload challan image (optional)'}
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, WebP, PDF (Max 5MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-600">
                    New Receipt to Upload:
                  </div>
                  <div className="relative inline-block">
                    {challanPreview === 'PDF' ? (
                      <div className="w-64 h-64 bg-gray-100 rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center">
                        <span className="text-6xl mb-2">📄</span>
                        <span className="text-sm font-medium text-gray-700">PDF File Selected</span>
                        <span className="text-xs text-gray-500 mt-1">{formData.challan?.name}</span>
                      </div>
                    ) : (
                      <img
                        src={challanPreview}
                        alt="New Challan Preview"
                        className="w-64 h-64 object-cover rounded-lg border-2 border-green-400"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveNewChallan}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    ✅ This will replace the existing receipt when you save
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/coloader-bookings')}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-4 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
              >
                {updating ? '🔄 Updating Co-Loader...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Information</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• The linked docket cannot be changed</li>
            <li>• You can update transport company name and docket number</li>
            <li>• Upload a new receipt to replace the existing one (optional)</li>
            <li>• All changes will be saved when you click "Save Changes"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}