import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function UpdateDocket() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState('');
  
  // ✅ NEW: Dimensions array state
  const [dimensions, setDimensions] = useState([]);

  // =========================
  // FETCH DATA BY DOCKET ID
  // =========================
  useEffect(() => {
    const fetchDocket = async () => {
      const res = await fetch(`http://localhost:5000/api/v1/dockets/${id}`);
      const result = await res.json();
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

      // ✅ NEW: Load dimensions array from backend
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
        // Default: one empty row if no dimensions exist
        setDimensions([{ id: 1, length: "0", width: "0", height: "0", noOfPackets: "0" }]);
      }
    };

    if (id) fetchDocket();
  }, [id]);

  // =========================
  // CHANGE HANDLER
  // =========================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ NEW: Handle dimension row changes
  const handleDimensionChange = (id, field, value) => {
    setDimensions(prev =>
      prev.map(dim =>
        dim.id === id ? { ...dim, [field]: value } : dim
      )
    );
  };

  // ✅ NEW: Add new dimension row (max 8)
  const addDimensionRow = () => {
    if (dimensions.length < 8) {
      const newId = dimensions.length > 0 ? Math.max(...dimensions.map(d => d.id)) + 1 : 1;
      setDimensions(prev => [...prev, { id: newId, length: "0", width: "0", height: "0", noOfPackets: "0" }]);
    }
  };

  // ✅ NEW: Remove dimension row
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
      // ✅ UPDATED: Include dimensions array in update
      const updatePayload = {
        ...formData,
        dimensions: dimensions // Send dimensions array
      };

      const response = await fetch(`http://localhost:5000/api/v1/dockets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Docket updated successfully!');
        // Scroll to top to show message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage(`❌ Error: ${data.message || 'Failed to update docket'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DOWNLOAD PDF HANDLER
  // =========================
  const handleDownloadPDF = () => {
    navigate(`/html-to-pdf/${id}`);
  };

  // =========================
  // UPDATE ACTIVITY HANDLER
  // =========================
  const handleUpdateActivity = () => {
    navigate(`/update-activity/${id}`); // ✅ Navigate to activity page
  };

  if (!formData) return <div className="p-6">Loading…</div>;

  // =========================
  // FULL FORM LAYOUT
  // =========================
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Fixed Action Buttons */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handleUpdateActivity}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow-lg flex items-center gap-2"
        >
          Activity
        </button>
        <button
          onClick={handleDownloadPDF}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded shadow-lg flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          PDF
        </button>
      </div>

      <form
        onSubmit={handleUpdate}
        className="max-w-7xl mx-auto space-y-6"
      >

        {/* Message Notification */}
        {message && (
          <div className={`p-4 rounded-md ${message.includes('✅') ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* ================= Invoice Details ================= */}
        <div className="bg-white border border-gray-300 rounded-md p-4">
          <div className="flex justify-between items-center mb-4">
            <label className="flex items-center gap-2 font-semibold text-sm">
              <input type="checkbox" defaultChecked />
              Invoice Details
            </label>

            <button
              type="button"
              className="bg-blue-600 text-white text-xs px-3 py-1 rounded"
            >
              + ADD INVOICE
            </button>
          </div>

          <div className="grid grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">E-WayBill</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="eWayBill"
                value={formData.eWayBill}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Inv. No.</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="invNo"
                value={formData.invNo}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Inv. Date</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                type="date"
                name="invDate"
                value={formData.invDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Net Inv Value</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="netInvValue"
                value={formData.netInvValue}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">G Inv Value</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="gInvValue"
                value={formData.gInvValue}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Part No.</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="partNo"
                value={formData.partNo}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Item Description</label>
            <textarea
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm h-20"
              name="itemDesc"
              value={formData.itemDesc}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Packet</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="packet"
                value={formData.packet}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ================= Docket Info in 3 Columns ================= */}
        <div className="grid grid-cols-3 gap-4">
          {/* Docket Info */}
          <div className="bg-white border border-gray-300 rounded-md p-4 space-y-3">
            <h3 className="font-semibold text-sm">Docket Info</h3>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Docket No.</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="docketNo"
                value={formData.docketNo}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Booking Date</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Destination/City</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="destinationCity"
                value={formData.destinationCity}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expected Delivery</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                type="date"
                name="expectedDelivery"
                value={formData.expectedDelivery}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white border border-gray-300 rounded-md p-4 space-y-3">
            <h3 className="font-semibold text-sm">Booking Details</h3>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer Type</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
              >
                <option>Contractual Client</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Booking Mode</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="bookingMode"
                value={formData.bookingMode}
                onChange={handleChange}
              >
                <option>ROAD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Origin</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Origin City</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="originCity"
                value={formData.originCity}
                onChange={handleChange}
                placeholder="Enter city name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Origin Location</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="originLocation"
                value={formData.originLocation}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Destination Branch</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="destinationBranch"
                value={formData.destinationBranch}
                onChange={handleChange}
                placeholder="Enter branch name"
              />
            </div>
          </div>

          {/* Billing Details */}
          <div className="bg-white border border-gray-300 rounded-md p-4 space-y-3">
            <h3 className="font-semibold text-sm">Billing Details</h3>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Billing Party</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="billingParty"
                value={formData.billingParty}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Billing At</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="billingAt"
                value={formData.billingAt}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Origin">Origin</option>
                <option value="Destination">Destination</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Booking Type</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="bookingType"
                value={formData.bookingType}
                onChange={handleChange}
              >
                <option>To Be Billed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Mode</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="deliveryMode"
                value={formData.deliveryMode}
                onChange={handleChange}
              >
                <option>Door Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Load Type</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="loadType"
                value={formData.loadType}
                onChange={handleChange}
              >
                <option>PTL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN No.</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="gstinNo"
                value={formData.gstinNo}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ================= Consignor & Consignee in 2 Columns ================= */}
        <div className="grid grid-cols-2 gap-4">
          {/* Consignor */}
          <div className="bg-white border border-gray-300 rounded-md p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input 
                type="checkbox"
                name="isTemporaryConsignor"
                checked={formData.isTemporaryConsignor}
                onChange={handleChange}
              />
              Is Temporary Consignor
            </label>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Consignor</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="consignor"
                value={formData.consignor}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <textarea
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm h-20"
                name="consignorAddress"
                value={formData.consignorAddress}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  name="consignorCity"
                  value={formData.consignorCity}
                  onChange={handleChange}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pin</label>
                <input 
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  name="consignorPin"
                  value={formData.consignorPin}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  name="consignorState"
                  value={formData.consignorState}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  name="consignorPhone"
                  value={formData.consignorPhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN No.</label>
              <input 
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="crgstinNo"
                value={formData.crgstinNo}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Consignee */}
          <div className="bg-white border border-gray-300 rounded-md p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input 
                type="checkbox"
                name="isTemporaryConsignee"
                checked={formData.isTemporaryConsignee}
                onChange={handleChange}
              />
              Is Temporary Consignee
            </label>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Consignee</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="consignee"
                value={formData.consignee}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <textarea
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm h-20"
                name="consigneeAddress"
                value={formData.consigneeAddress}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  name="consigneeCity"
                  value={formData.consigneeCity}
                  onChange={handleChange}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pin</label>
                <input 
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  name="consigneePin"
                  value={formData.consigneePin}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  name="consigneeState"
                  value={formData.consigneeState}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  name="consigneePhone"
                  value={formData.consigneePhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN No.</label>
              <input 
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                name="cegstinNo"
                value={formData.cegstinNo}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ================= DYNAMIC DIMENSIONS SECTION ================= */}
        <div className="bg-white border border-gray-300 rounded-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm">Dimensions</h3>
            <button
              type="button"
              onClick={addDimensionRow}
              disabled={dimensions.length >= 8}
              className={`${
                dimensions.length >= 8 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white font-bold px-4 py-1 rounded text-sm flex items-center gap-1`}
            >
              <span className="text-lg">+</span>
              Add Row
            </button>
          </div>

          {/* Dimension Rows */}
          <div className="space-y-3">
            {dimensions.map((dim, index) => (
              <div key={dim.id} className="grid grid-cols-5 gap-4 items-end pb-3 border-b border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Length {index + 1}
                  </label>
                  <input 
                    type="number" 
                    value={dim.length}
                    onChange={(e) => handleDimensionChange(dim.id, 'length', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                  <input 
                    type="number" 
                    value={dim.width}
                    onChange={(e) => handleDimensionChange(dim.id, 'width', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                  <input 
                    type="number" 
                    value={dim.height}
                    onChange={(e) => handleDimensionChange(dim.id, 'height', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">No. of Packets</label>
                  <input 
                    type="number" 
                    value={dim.noOfPackets}
                    onChange={(e) => handleDimensionChange(dim.id, 'noOfPackets', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm" 
                  />
                </div>
                <div>
                  {dimensions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDimensionRow(dim.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm w-full"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info text */}
          <div className="mt-3 text-xs text-gray-600">
            {dimensions.length >= 8 ? (
              <span className="text-red-600 font-medium">Maximum 8 dimension rows reached</span>
            ) : (
              <span>Click "+ Add Row" to add more dimensions (max 8)</span>
            )}
          </div>
        </div>

        {/* ================= Submit ================= */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:bg-gray-400"
          >
            {loading ? 'UPDATING...' : 'UPDATE DOCKET'}
          </button>
        </div>

      </form>
    </div>
  );
}