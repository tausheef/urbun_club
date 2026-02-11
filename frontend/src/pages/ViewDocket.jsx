// src/pages/ViewDocket.jsx
// READ-ONLY VERSION - Users can view but not edit docket details

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { docketAPI } from "../utils/api";

export default function ViewDocket() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);
  const [dimensions, setDimensions] = useState([]);

  // Fetch docket data
  useEffect(() => {
    const fetchDocket = async () => {
      try {
        const result = await docketAPI.getById(id);
        const { docket, bookingInfo, invoice, consignor, consignee } = result.data;

        setFormData({
          // Docket
          docketNo: docket?.docketNo || "",
          bookingDate: docket?.bookingDate?.slice(0, 10) || "",
          destinationCity: docket?.destinationCity || "",
          location: docket?.location || "",
          postalCode: docket?.postalCode || "",
          expectedDelivery: docket?.expectedDelivery?.slice(0, 10) || "",

          // Booking Info
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

          // Invoice
          eWayBill: invoice?.eWayBill || "",
          invNo: invoice?.invoiceNo || "",
          invDate: invoice?.invoiceDate?.slice(0, 10) || "",
          partNo: invoice?.partNo || "",
          itemDesc: invoice?.itemDescription || "",
          weight: invoice?.weight || "",
          packet: invoice?.packet || "",
          netInvValue: invoice?.netInvoiceValue || "",
          gInvValue: invoice?.grossInvoiceValue || "",

          // Consignor
          consignor: consignor?.consignorName || "",
          consignorAddress: consignor?.address || "",
          consignorCity: consignor?.city || "",
          consignorState: consignor?.state || "",
          consignorPin: consignor?.pin || "",
          consignorPhone: consignor?.phone || "",
          crgstinNo: consignor?.gstinNo || "",

          // Consignee
          consignee: consignee?.consigneeName || "",
          consigneeAddress: consignee?.address || "",
          consigneeCity: consignee?.city || "",
          consigneeState: consignee?.state || "",
          consigneePin: consignee?.pin || "",
          consigneePhone: consignee?.phone || "",
          cegstinNo: consignee?.gstinNo || "",
        });

        // Set dimensions
        if (docket?.dimensions) {
          setDimensions(docket.dimensions);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching docket:", error);
        setLoading(false);
      }
    };

    fetchDocket();
  }, [id]);

  const handleBack = () => {
    navigate("/totalbooking");
  };

  const handleActivity = () => {
    navigate(`/update-activity/${id}`);
  };

  const handleDownloadPDF = () => {
    window.open(`/html-to-pdf/${id}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading docket details...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Docket not found</p>
          <button
            onClick={handleBack}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">📄 View Docket</h1>
              <p className="text-gray-600 mt-1">
                Docket No: <span className="font-semibold text-blue-600">{formData.docketNo}</span>
                <span className="ml-4 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  Read-Only
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleActivity}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <span>📍</span> Activity
              </button>
              <button
                onClick={handleDownloadPDF}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <span>📥</span> PDF
              </button>
              <button
                onClick={handleBack}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - All fields DISABLED */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-8">
          
          {/* Docket Details Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">📦 Docket Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Docket No</label>
                <input
                  type="text"
                  value={formData.docketNo}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Booking Date</label>
                <input
                  type="date"
                  value={formData.bookingDate}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination City</label>
                <input
                  type="text"
                  value={formData.destinationCity}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery</label>
                <input
                  type="date"
                  value={formData.expectedDelivery}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Booking Info Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">📋 Booking Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                <input
                  type="text"
                  value={formData.customerType}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Booking Mode</label>
                <input
                  type="text"
                  value={formData.bookingMode}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                <input
                  type="text"
                  value={formData.origin}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Origin City</label>
                <input
                  type="text"
                  value={formData.originCity}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination Branch</label>
                <input
                  type="text"
                  value={formData.destinationBranch}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Party</label>
                <input
                  type="text"
                  value={formData.billingParty}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Invoice Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">🧾 Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-way Bill</label>
                <input
                  type="text"
                  value={formData.eWayBill}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice No</label>
                <input
                  type="text"
                  value={formData.invNo}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date</label>
                <input
                  type="date"
                  value={formData.invDate}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                <input
                  type="text"
                  value={formData.weight}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Packet</label>
                <input
                  type="text"
                  value={formData.packet}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Dimensions Section */}
          {dimensions.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">📐 Dimensions</h2>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">Length</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Width</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Height</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">No. of Packets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dimensions.map((dim, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{dim.length || 0}</td>
                        <td className="border border-gray-300 px-4 py-2">{dim.width || 0}</td>
                        <td className="border border-gray-300 px-4 py-2">{dim.height || 0}</td>
                        <td className="border border-gray-300 px-4 py-2">{dim.noOfPackets || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Consignor Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">📤 Consignor Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.consignor}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.consignorAddress}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.consignorCity}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.consignorPhone}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Consignee Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">📥 Consignee Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.consignee}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.consigneeAddress}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.consigneeCity}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.consigneePhone}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Read-Only Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-700 text-sm">
              ℹ️ This is a read-only view. You cannot edit docket details.
              <br />
              You can still add <strong>Activities</strong> and download <strong>PDF</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}