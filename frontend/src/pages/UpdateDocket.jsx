import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Edit2, ArrowLeft, Save, Download, Activity } from "lucide-react";
import { docketAPI } from "../utils/api";

export default function UpdateDocket() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState('');
  const [dimensions, setDimensions] = useState([]);
  
  // ✅ NEW: Search functionality
  const [searchMode, setSearchMode] = useState(!id); // true if no ID in URL
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // =========================
  // SEARCH DOCKETS
  // =========================
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const data = await docketAPI.getAll();
      
      if (data.success && data.data) {
        const filtered = data.data.filter(item => {
          const docketNo = item.docket?.docketNo || '';
          const consignorName = item.docket?.consignor?.consignorName || '';
          const consigneeName = item.docket?.consignee?.consigneeName || '';
          
          const searchLower = query.toLowerCase();
          return (
            docketNo.toLowerCase().includes(searchLower) ||
            consignorName.toLowerCase().includes(searchLower) ||
            consigneeName.toLowerCase().includes(searchLower)
          );
        });
        
        setSearchResults(filtered.slice(0, 10)); // Show max 10 results
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // =========================
  // SELECT DOCKET TO EDIT
  // =========================
  const selectDocket = (docketId) => {
    navigate(`/update-docket/${docketId}`);
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // =========================
  // FETCH DATA BY DOCKET ID
  // =========================
  useEffect(() => {
    const fetchDocket = async () => {
      setLoading(true);
      try {
        const result = await docketAPI.getById(id);
        const { docket, bookingInfo, invoice } = result.data;

        setFormData({
          // ---------- DOCKET ----------
          docketNo: docket?.docketNo || "",
          bookingDate: docket?.bookingDate?.slice(0, 10) || "",
          destinationCity: docket?.destinationCity || "",
          location: docket?.location || "",
          postalCode: docket?.postalCode || "",
          expectedDelivery: docket?.expectedDelivery?.slice(0, 10) || "",

          // ---------- BOOKING ----------
          customerType: bookingInfo?.customerType || "",
          bookingMode: bookingInfo?.bookingMode || "",
          origin: bookingInfo?.origin || "",
          originCity: bookingInfo?.originCity || "",
          originLocation: bookingInfo?.originLocation || "",
          destinationBranch: bookingInfo?.destinationBranch || "",
          billingParty: bookingInfo?.billingParty || "",
          billingAt: bookingInfo?.billingAt || "",
          bookingType: bookingInfo?.bookingType || "",
          deliveryMode: bookingInfo?.deliveryMode || "",
          loadType: bookingInfo?.loadType || "",
          gstinNo: bookingInfo?.gstinNo || "",

          // ---------- INVOICE ----------
          eWayBill: invoice?.eWayBill || "",
          invNo: invoice?.invoiceNo || "",
          invDate: invoice?.invoiceDate?.slice(0, 10) || "",
          partNo: invoice?.partNo || "",
          itemDesc: invoice?.itemDescription || "",
          weight: invoice?.weight || 0,
          packet: invoice?.packet || 0,
          netInvValue: invoice?.netInvoiceValue || 0,
          gInvValue: invoice?.grossInvoiceValue || 0,

          // ---------- CONSIGNOR ----------
          isTemporaryConsignor: docket?.consignor?.isTemporary || false,
          consignor: docket?.consignor?.consignorName || "",
          consignorAddress: docket?.consignor?.address || "",
          consignorCity: docket?.consignor?.city || "",
          consignorState: docket?.consignor?.state || "",
          consignorPin: docket?.consignor?.pin || "",
          consignorPhone: docket?.consignor?.phone || "",
          crgstinNo: docket?.consignor?.crgstinNo || "",

          // ---------- CONSIGNEE ----------
          isTemporaryConsignee: docket?.consignee?.isTemporary || false,
          consignee: docket?.consignee?.consigneeName || "",
          consigneeAddress: docket?.consignee?.address || "",
          consigneeCity: docket?.consignee?.city || "",
          consigneeState: docket?.consignee?.state || "",
          consigneePin: docket?.consignee?.pin || "",
          consigneePhone: docket?.consignee?.phone || "",
          cegstinNo: docket?.consignee?.cegstinNo || "",
        });

        // Load dimensions
        if (docket?.dimensions && Array.isArray(docket.dimensions) && docket.dimensions.length > 0) {
          setDimensions(
            docket.dimensions.map((dim, index) => ({
              id: index + 1,
              length: dim.length?.toString() || "0",
              width: dim.width?.toString() || "0",
              height: dim.height?.toString() || "0",
              noOfPackets: dim.noOfPackets?.toString() || "0",
            }))
          );
        } else {
          setDimensions([{ id: 1, length: "0", width: "0", height: "0", noOfPackets: "0" }]);
        }
      } catch (error) {
        console.error('Error fetching docket:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch docket';
        setMessage(`❌ ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocket();
      setSearchMode(false);
    } else {
      setSearchMode(true);
    }
  }, [id]);

  // =========================
  // CHANGE HANDLERS
  // =========================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDimensionChange = (id, field, value) => {
    setDimensions(prev =>
      prev.map(dim =>
        dim.id === id ? { ...dim, [field]: value } : dim
      )
    );
  };

  const addDimensionRow = () => {
    if (dimensions.length < 8) {
      const newId = dimensions.length > 0 ? Math.max(...dimensions.map(d => d.id)) + 1 : 1;
      setDimensions(prev => [...prev, { id: newId, length: "0", width: "0", height: "0", noOfPackets: "0" }]);
    }
  };

  const removeDimensionRow = (id) => {
    if (dimensions.length > 1) {
      setDimensions(prev => prev.filter(dim => dim.id !== id));
    }
  };

  // =========================
  // UPDATE SUBMIT
  // =========================
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const updatePayload = {
        ...formData,
        dimensions: dimensions
      };

      const data = await docketAPI.update(id, updatePayload);

      if (data.success) {
        setMessage('✅ Docket updated successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`❌ Error: ${data.message || 'Failed to update docket'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update docket';
      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    navigate(`/html-to-pdf/${id}`);
  };

  const handleUpdateActivity = () => {
    navigate(`/update-activity/${id}`);
  };

  const handleBackToSearch = () => {
    navigate('/update-docket');
    setSearchMode(true);
    setFormData(null);
  };

  // =========================
  // SEARCH MODE UI
  // =========================
  if (searchMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Edit2 className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Modify Docket</h1>
                <p className="text-sm text-gray-600">Search and edit docket information</p>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Search by Docket Number, Consignor or Consignee
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type to search dockets..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Search Results */}
            {searchLoading && (
              <div className="mt-4 text-center py-8">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="mt-3 text-gray-600">Searching...</p>
              </div>
            )}

            {!searchLoading && searchQuery && searchResults.length === 0 && (
              <div className="mt-4 text-center py-8 text-gray-500">
                <p>No dockets found matching "{searchQuery}"</p>
              </div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600 mb-3">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </p>
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectDocket(item.docket._id)}
                    className="bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg p-4 cursor-pointer transition group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-blue-600 group-hover:text-blue-700">
                            {item.docket?.docketNo || '-'}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {item.docket?.bookingDate
                              ? new Date(item.docket.bookingDate).toLocaleDateString('en-IN')
                              : '-'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Consignor: </span>
                            <span className="font-medium text-gray-800">
                              {item.docket?.consignor?.consignorName || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Consignee: </span>
                            <span className="font-medium text-gray-800">
                              {item.docket?.consignee?.consigneeName || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Origin: </span>
                            <span className="font-medium text-gray-800">
                              {item.bookingInfo?.originCity || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Destination: </span>
                            <span className="font-medium text-gray-800">
                              {item.docket?.destinationCity || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-blue-600 group-hover:translate-x-1 transition">
                        <Edit2 size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // LOADING STATE
  // =========================
  if (loading || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading docket...</p>
        </div>
      </div>
    );
  }

  // =========================
  // EDIT MODE UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToSearch}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Search</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Editing Docket: {formData.docketNo}
                </h1>
                <p className="text-sm text-gray-600">
                  Make changes and click Update to save
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateActivity}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
              >
                <Activity size={18} />
                Activity
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
              >
                <Download size={18} />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`max-w-7xl mx-auto px-6 pt-4`}>
          <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleUpdate} className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Docket Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Docket Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Docket No</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                  name="docketNo"
                  value={formData.docketNo}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="bookingDate"
                  value={formData.bookingDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination City</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="destinationCity"
                  value={formData.destinationCity}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="expectedDelivery"
                  value={formData.expectedDelivery}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Booking Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="customerType"
                  value={formData.customerType}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Mode</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="bookingMode"
                  value={formData.bookingMode}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin City</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="originCity"
                  value={formData.originCity}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin Location</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="originLocation"
                  value={formData.originLocation}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Branch</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="destinationBranch"
                  value={formData.destinationBranch}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* More Booking Fields */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Additional Booking Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Party</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="billingParty"
                  value={formData.billingParty}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing At</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="billingAt"
                  value={formData.billingAt}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Type</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="bookingType"
                  value={formData.bookingType}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Mode</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="deliveryMode"
                  value={formData.deliveryMode}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Load Type</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="loadType"
                  value={formData.loadType}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN No</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="gstinNo"
                  value={formData.gstinNo}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Invoice Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Invoice Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Way Bill</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="eWayBill"
                  value={formData.eWayBill}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="invNo"
                  value={formData.invNo}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="invDate"
                  value={formData.invDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part No</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="partNo"
                  value={formData.partNo}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20"
                  name="itemDesc"
                  value={formData.itemDesc}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Packets</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="packet"
                    value={formData.packet}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Invoice Value</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="netInvValue"
                    value={formData.netInvValue}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gross Invoice Value</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="gInvValue"
                    value={formData.gInvValue}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Consignor and Consignee - Full Width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Consignor */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800">Consignor Details</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isTemporaryConsignor"
                  checked={formData.isTemporaryConsignor}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-gray-600">Temporary</span>
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consignor Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="consignor"
                  value={formData.consignor}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20"
                  name="consignorAddress"
                  value={formData.consignorAddress}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="consignorCity"
                    value={formData.consignorCity}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pin</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="consignorPin"
                    value={formData.consignorPin}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="consignorState"
                    value={formData.consignorState}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="consignorPhone"
                    value={formData.consignorPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN No.</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="crgstinNo"
                  value={formData.crgstinNo}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Consignee */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800">Consignee Details</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isTemporaryConsignee"
                  checked={formData.isTemporaryConsignee}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-gray-600">Temporary</span>
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consignee Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="consignee"
                  value={formData.consignee}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20"
                  name="consigneeAddress"
                  value={formData.consigneeAddress}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="consigneeCity"
                    value={formData.consigneeCity}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pin</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="consigneePin"
                    value={formData.consigneePin}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="consigneeState"
                    value={formData.consigneeState}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    name="consigneePhone"
                    value={formData.consigneePhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN No.</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="cegstinNo"
                  value={formData.cegstinNo}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-bold text-gray-800">Dimensions</h2>
            <button
              type="button"
              onClick={addDimensionRow}
              disabled={dimensions.length >= 8}
              className={`${
                dimensions.length >= 8
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition`}
            >
              <span className="text-lg">+</span>
              Add Row
            </button>
          </div>

          <div className="space-y-3">
            {dimensions.map((dim, index) => (
              <div key={dim.id} className="grid grid-cols-5 gap-4 items-end pb-3 border-b border-gray-100 last:border-0">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Length {index + 1}
                  </label>
                  <input
                    type="number"
                    value={dim.length}
                    onChange={(e) => handleDimensionChange(dim.id, 'length', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                  <input
                    type="number"
                    value={dim.width}
                    onChange={(e) => handleDimensionChange(dim.id, 'width', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                  <input
                    type="number"
                    value={dim.height}
                    onChange={(e) => handleDimensionChange(dim.id, 'height', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">No. of Packets</label>
                  <input
                    type="number"
                    value={dim.noOfPackets}
                    onChange={(e) => handleDimensionChange(dim.id, 'noOfPackets', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  {dimensions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDimensionRow(dim.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm w-full transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-xs text-gray-600">
            {dimensions.length >= 8 ? (
              <span className="text-red-600 font-medium">Maximum 8 dimension rows reached</span>
            ) : (
              <span>Click "+ Add Row" to add more dimensions (max 8)</span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-gray-50 py-4 border-t">
          <button
            type="button"
            onClick={handleBackToSearch}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold disabled:bg-gray-400 flex items-center gap-2 transition"
          >
            <Save size={18} />
            {loading ? 'UPDATING...' : 'UPDATE DOCKET'}
          </button>
        </div>

      </form>
    </div>
  );
}