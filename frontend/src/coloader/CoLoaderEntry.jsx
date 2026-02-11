import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { docketAPI, coLoaderAPI } from '../utils/api';

export default function CoLoaderEntry() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    docketId: '',
    transportName: '',
    transportDocket: '',
    challan: null,
  });

  const [dockets, setDockets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDockets, setFilteredDockets] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDocket, setSelectedDocket] = useState(null);
  
  const [challanPreview, setChallanPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch all dockets on mount
  useEffect(() => {
    fetchDockets();
  }, []);

  const fetchDockets = async () => {
    try {
      const response = await docketAPI.getAll();
      if (response.success && response.data) {
        // Only show active dockets without co-loader
        const availableDockets = response.data
          .filter(item => 
            item.docket?.docketStatus === 'Active' && 
            item.docket?.coLoader === false
          )
          .map(item => ({
            _id: item.docket._id,
            docketNo: item.docket.docketNo,
            bookingDate: item.docket.bookingDate,
            consignor: item.docket.consignor?.consignorName || '-',
            consignee: item.docket.consignee?.consigneeName || '-',
            destination: item.docket.destinationCity || '-',
          }));
        
        setDockets(availableDockets);
        setFilteredDockets(availableDockets);
      }
    } catch (error) {
      console.error('Error fetching dockets:', error);
      showMessage('error', 'Failed to load dockets');
    }
  };

  // Handle search input
  const handleSearch = (value) => {
    setSearchTerm(value);
    setShowDropdown(true);

    if (!value.trim()) {
      setFilteredDockets(dockets);
      return;
    }

    const filtered = dockets.filter(d =>
      d.docketNo.toLowerCase().includes(value.toLowerCase()) ||
      d.consignor.toLowerCase().includes(value.toLowerCase()) ||
      d.consignee.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredDockets(filtered);
  };

  // Select docket from dropdown
  const handleSelectDocket = (docket) => {
    setSelectedDocket(docket);
    setFormData(prev => ({ ...prev, docketId: docket._id }));
    setSearchTerm(docket.docketNo);
    setShowDropdown(false);
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('error', 'Only JPG, PNG, and WebP images are allowed');
      return;
    }

    setFormData(prev => ({ ...prev, challan: file }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setChallanPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove challan image
  const handleRemoveChallan = () => {
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
    setLoading(true);

    try {
      // Validate required fields only
      if (!formData.docketId) {
        showMessage('error', 'Please select a docket');
        setLoading(false);
        return;
      }

      if (!formData.transportName.trim()) {
        showMessage('error', 'Please enter transport name');
        setLoading(false);
        return;
      }

      if (!formData.transportDocket.trim()) {
        showMessage('error', 'Please enter transport docket');
        setLoading(false);
        return;
      }

      // Challan is now optional - no validation needed

      // Create co-loader
      const response = await coLoaderAPI.create(formData);

      if (response.success) {
        showMessage('success', 'Co-Loader created successfully!');
        
        // Reset form
        setFormData({
          docketId: '',
          transportName: '',
          transportDocket: '',
          challan: null,
        });
        setSearchTerm('');
        setSelectedDocket(null);
        setChallanPreview(null);

        // Refresh dockets list
        fetchDockets();

        // Navigate to bookings after 2 seconds
        setTimeout(() => {
          navigate('/coloader-bookings');
        }, 2000);
      } else {
        showMessage('error', response.message || 'Failed to create co-loader');
      }
    } catch (error) {
      console.error('Create co-loader error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to create co-loader');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🚛 Co-Loader Entry</h1>
              <p className="text-orange-100 mt-1">
                Link docket with co-loader transport company
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
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

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Docket Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1️⃣ Select Docket <span className="text-red-500">*</span>
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by Docket No, Consignor, or Consignee..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                {/* Dropdown */}
                {showDropdown && filteredDockets.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredDockets.map((docket) => (
                      <button
                        key={docket._id}
                        type="button"
                        onClick={() => handleSelectDocket(docket)}
                        className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 transition-colors"
                      >
                        <div className="font-semibold text-orange-600">
                          {docket.docketNo}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {docket.consignor} → {docket.consignee}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          To: {docket.destination} | Date: {new Date(docket.bookingDate).toLocaleDateString('en-IN')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && filteredDockets.length === 0 && searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No available dockets found
                  </div>
                )}
              </div>

              {/* Selected Docket Info */}
              {selectedDocket && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-orange-700">
                        Selected: {selectedDocket.docketNo}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {selectedDocket.consignor} → {selectedDocket.consignee}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocket(null);
                        setSearchTerm('');
                        setFormData(prev => ({ ...prev, docketId: '' }));
                      }}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Create New Docket Button */}
              <button
                type="button"
                onClick={() => navigate('/docketentry')}
                className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                ➕ Or create new docket
              </button>
            </div>

            {/* Transport Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2️⃣ Transport Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="transportName"
                value={formData.transportName}
                onChange={handleInputChange}
                placeholder="Enter co-loader company name"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Transport Docket */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3️⃣ Transport Docket Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="transportDocket"
                value={formData.transportDocket}
                onChange={handleInputChange}
                placeholder="Enter co-loader's docket number"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Challan Upload - NOW OPTIONAL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4️⃣ Challan / Receipt <span className="text-gray-400">(Optional)</span>
              </label>

              {!challanPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleChallanChange}
                    className="hidden"
                    id="challan-upload"
                  />
                  <label
                    htmlFor="challan-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-3xl">📄</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload challan image (optional)
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, WebP (Max 5MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={challanPreview}
                    alt="Challan Preview"
                    className="w-64 h-64 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveChallan}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
            >
              {loading ? '🔄 Creating Co-Loader...' : '✅ Create Co-Loader Entry'}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Information</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Only active dockets without existing co-loader are shown</li>
            <li>• Each docket can have only one co-loader</li>
            <li>• Challan image is optional - can be uploaded later</li>
            <li>• You can create new docket if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}