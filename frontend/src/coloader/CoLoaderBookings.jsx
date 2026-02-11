import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { coLoaderAPI } from '../utils/api';

export default function CoLoaderBookings() {
  const navigate = useNavigate();
  
  const [coLoaders, setCoLoaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, docketNo: '' });
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch co-loaders on mount
  useEffect(() => {
    fetchCoLoaders();
  }, []);

  const fetchCoLoaders = async () => {
    try {
      setLoading(true);
      const response = await coLoaderAPI.getAll();
      
      if (response.success) {
        // ✅ Filter out co-loaders with cancelled dockets
        const activeCoLoaders = (response.data || []).filter(
          coLoader => coLoader.docketId?.docketStatus !== 'Cancelled'
        );
        setCoLoaders(activeCoLoaders);
      } else {
        showMessage('error', 'Failed to load co-loader bookings');
      }
    } catch (error) {
      console.error('Error fetching co-loaders:', error);
      showMessage('error', 'Failed to load co-loader bookings');
    } finally {
      setLoading(false);
    }
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      const response = await coLoaderAPI.delete(deleteModal.id);
      
      if (response.success) {
        showMessage('success', 'Co-loader deleted successfully');
        fetchCoLoaders(); // Refresh list
        setDeleteModal({ show: false, id: null, docketNo: '' });
      } else {
        showMessage('error', response.message || 'Failed to delete co-loader');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to delete co-loader');
    }
  };

  // Filter co-loaders based on search
  const filteredCoLoaders = coLoaders.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.docketId?.docketNo?.toLowerCase().includes(searchLower) ||
      item.transportName?.toLowerCase().includes(searchLower) ||
      item.transportDocket?.toLowerCase().includes(searchLower)
    );
  });

  // View challan image in modal
  const viewChallan = (challanUrl) => {
    setSelectedImage(challanUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🚛 Co-Loader Bookings</h1>
              <p className="text-orange-100 mt-1">
                View all dockets with co-loader assignments
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/coloader-entry')}
                className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                ➕ New Co-Loader
              </button>
              <button
                onClick={() => navigate(-1)}
                className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors"
              >
                ← Back
              </button>
            </div>
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

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search by Docket No, Transport Name, or Transport Docket..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-gray-500 text-sm">Total Co-Loaders</div>
            <div className="text-2xl font-bold text-orange-600">{coLoaders.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-gray-500 text-sm">With Receipt</div>
            <div className="text-2xl font-bold text-green-600">
              {coLoaders.filter(c => c.challan?.url).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-gray-500 text-sm">Without Receipt</div>
            <div className="text-2xl font-bold text-amber-600">
              {coLoaders.filter(c => !c.challan?.url).length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              <p className="text-gray-600 mt-4">Loading co-loader bookings...</p>
            </div>
          ) : filteredCoLoaders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm ? 'No matching co-loaders found' : 'No co-loader bookings yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try different search terms' : 'Start by creating a new co-loader entry'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/coloader-entry')}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  ➕ Create First Co-Loader
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Docket ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      TP Docket
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      TP Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Receipt
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCoLoaders.map((coLoader, index) => (
                    <tr 
                      key={coLoader._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-orange-600">
                          {coLoader.docketId?.docketNo || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {coLoader.docketId?.destinationCity || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {coLoader.transportDocket}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {coLoader.transportName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {coLoader.challan?.url ? (
                          <button
                            onClick={() => viewChallan(coLoader.challan.url)}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                          >
                            📄 View
                          </button>
                        ) : (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                            ⚠️ Not Uploaded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(coLoader.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/coloader-details/${coLoader._id}`)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => navigate(`/coloader-modify/${coLoader._id}`)}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setDeleteModal({
                              show: true,
                              id: coLoader._id,
                              docketNo: coLoader.docketId?.docketNo || 'this co-loader'
                            })}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Information</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• TP Docket = Transport company's docket number</li>
            <li>• TP Name = Transport company name</li>
            <li>• Receipt = Challan/Receipt image (optional)</li>
            <li>• Click "View" to see full co-loader details</li>
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🗑️ Delete Co-Loader?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete co-loader for docket{' '}
              <span className="font-semibold text-orange-600">{deleteModal.docketNo}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, docketNo: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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