import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { coLoaderAPI } from '../utils/api';

export default function CoLoaderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [coLoader, setCoLoader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch co-loader details on mount
  useEffect(() => {
    fetchCoLoaderDetails();
  }, [id]);

  const fetchCoLoaderDetails = async () => {
    try {
      setLoading(true);
      const response = await coLoaderAPI.getById(id);
      
      if (response.success) {
        setCoLoader(response.data);
      } else {
        showMessage('error', 'Failed to load co-loader details');
      }
    } catch (error) {
      console.error('Error fetching co-loader:', error);
      showMessage('error', error.response?.data?.message || 'Failed to load co-loader details');
    } finally {
      setLoading(false);
    }
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
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
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🚛 Co-Loader Details</h1>
              <p className="text-orange-100 mt-1">
                View complete co-loader information
              </p>
            </div>
            <button
              onClick={() => navigate('/coloader-bookings')}
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

        {/* Details Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Section 1: Docket Information */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📋 Docket Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Docket Number
                </label>
                <div className="text-lg font-semibold text-orange-600">
                  {coLoader.docketId?.docketNo || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Booking Date
                </label>
                <div className="text-gray-900">
                  {coLoader.docketId?.bookingDate
                    ? new Date(coLoader.docketId.bookingDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Destination City
                </label>
                <div className="text-gray-900">
                  {coLoader.docketId?.destinationCity || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Docket Status
                </label>
                <div className="inline-block">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    coLoader.docketId?.docketStatus === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {coLoader.docketId?.docketStatus || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Transport Company Information */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              🚚 Transport Company Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Transport Company Name
                </label>
                <div className="text-gray-900 font-medium">
                  {coLoader.transportName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Transport Docket Number
                </label>
                <div className="text-gray-900 font-medium">
                  {coLoader.transportDocket}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Challan/Receipt */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📄 Challan / Receipt
            </h2>
            {coLoader.challan?.url ? (
              <div className="space-y-4">
                <img
                  src={coLoader.challan.url}
                  alt="Challan Receipt"
                  className="w-full max-w-md h-auto rounded-lg border-2 border-gray-300 cursor-pointer hover:border-orange-400 transition-colors"
                  onClick={() => setSelectedImage(coLoader.challan.url)}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedImage(coLoader.challan.url)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    🔍 View Full Size
                  </button>
                  <a
                    href={coLoader.challan.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    ⬇️ Download
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-amber-700 font-medium">
                  No receipt uploaded yet
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  Challan/receipt can be uploaded later
                </p>
              </div>
            )}
          </div>

          {/* Section 4: Meta Information */}
          <div className="p-6 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              ℹ️ Additional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Created By
                </label>
                <div className="text-gray-900">
                  {coLoader.createdBy?.name || coLoader.createdBy?.username || '-'}
                </div>
                {coLoader.createdBy?.email && (
                  <div className="text-sm text-gray-500">
                    {coLoader.createdBy.email}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Created On
                </label>
                <div className="text-gray-900">
                  {new Date(coLoader.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(coLoader.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {coLoader.updatedAt !== coLoader.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Last Updated
                  </label>
                  <div className="text-gray-900">
                    {new Date(coLoader.updatedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(coLoader.updatedAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/coloader-bookings')}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            ← Back to Bookings
          </button>
          <button
            onClick={() => navigate(`/coloader-modify/${id}`)}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            ✏️ Edit Co-Loader
          </button>
          <button
            onClick={() => navigate(`/view-docket/${coLoader.docketId?._id}`)}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            📋 View Docket
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Challan Receipt"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <a
              href={selectedImage}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 Open in New Tab
            </a>
          </div>
        </div>
      )}
    </div>
  );
}