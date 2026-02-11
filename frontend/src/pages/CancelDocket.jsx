import React, { useState } from 'react';
import { Search, XCircle, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { docketAPI } from '../utils/api';

export default function CancelDocket() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Cancel dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedDocket, setSelectedDocket] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Search dockets
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage('⚠️ Please enter a search term');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // ✅ Use the new API utility
      const data = await docketAPI.getAll();

      if (data.success) {
        // Filter active dockets only
        const activeDockets = data.data.filter(item => 
          item.docket?.docketStatus === 'Active'
        );

        // Search by docket number, consignor, or consignee
        const filtered = activeDockets.filter(item => {
          const docketNo = item.docket?.docketNo?.toLowerCase() || '';
          const consignor = item.docket?.consignor?.consignorName?.toLowerCase() || '';
          const consignee = item.docket?.consignee?.consigneeName?.toLowerCase() || '';
          const query = searchQuery.toLowerCase();

          return docketNo.includes(query) || 
                 consignor.includes(query) || 
                 consignee.includes(query);
        });

        setSearchResults(filtered);
        
        if (filtered.length === 0) {
          setMessage('🔍 No active dockets found');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage('❌ Error searching dockets');
    } finally {
      setLoading(false);
    }
  };

  // Open cancel dialog
  const openCancelDialog = (docketData) => {
    setSelectedDocket(docketData);
    setShowCancelDialog(true);
    setCancellationReason('');
  };

  // Close cancel dialog
  const closeCancelDialog = () => {
    setShowCancelDialog(false);
    setSelectedDocket(null);
    setCancellationReason('');
  };

  // Cancel docket
  const handleCancelDocket = async () => {
    if (!cancellationReason.trim()) {
      alert('Please enter a cancellation reason');
      return;
    }

    setCancelling(true);

    try {
      // ✅ Use the new API utility
      const data = await docketAPI.cancel(
        selectedDocket.docket._id,
        cancellationReason
      );

      if (data.success) {
        setMessage(`✅ Docket ${selectedDocket.docket.docketNo} cancelled successfully`);
        
        // Remove from search results
        setSearchResults(prev => 
          prev.filter(item => item.docket._id !== selectedDocket.docket._id)
        );
        
        closeCancelDialog();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Cancel error:', error);
      const errorMessage = error.response?.data?.message || 'Error cancelling docket';
      alert(`❌ ${errorMessage}`);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-red-50 border-l-4 border-red-600 p-6 mb-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <XCircle size={32} className="text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Cancel Docket</h1>
              <p className="text-gray-600 text-sm mt-1">
                Search and cancel active dockets (Admin Only)
              </p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">⚠️ Important:</p>
              <p className="mt-1">
                Cancelled dockets will be hidden from Total Booking and MIS Reports but remain in the database.
                You can restore them from the "Cancelled Dockets" page if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Search Active Dockets</h2>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by Docket Number, Consignor, or Consignee..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              <Search size={18} />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded ${
              message.includes('✅') ? 'bg-green-100 text-green-700' :
              message.includes('❌') ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h2 className="text-lg font-bold">
                Search Results ({searchResults.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Docket No</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Booking Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Consignor</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Consignee</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Origin</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Destination</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-blue-700">
                        {item.docket?.docketNo}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.docket?.bookingDate 
                          ? new Date(item.docket.bookingDate).toLocaleDateString('en-IN')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.docket?.consignor?.consignorName || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.docket?.consignee?.consigneeName || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.bookingInfo?.originCity || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.docket?.destinationCity || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openCancelDialog(item)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <XCircle size={14} />
                          CANCEL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        {showCancelDialog && selectedDocket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
              
              {/* Dialog Header */}
              <div className="bg-red-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-bold">Cancel Docket</h3>
                </div>
              </div>

              {/* Dialog Body */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 font-semibold mb-2">
                    Are you sure you want to cancel this docket?
                  </p>
                  <div className="bg-gray-100 p-3 rounded border border-gray-300 text-sm">
                    <p><span className="font-semibold">Docket No:</span> {selectedDocket.docket.docketNo}</p>
                    <p><span className="font-semibold">Consignor:</span> {selectedDocket.docket?.consignor?.consignorName || '-'}</p>
                    <p><span className="font-semibold">Consignee:</span> {selectedDocket.docket?.consignee?.consigneeName || '-'}</p>
                  </div>
                </div>

                {/* Cancellation Reason */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Cancellation *
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="e.g., Customer requested cancellation, Duplicate entry, Wrong details, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="4"
                  />
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-300 rounded p-3 text-xs text-yellow-800 mb-4">
                  <p className="font-semibold">⚠️ Note:</p>
                  <p className="mt-1">
                    • Docket will be hidden from Total Booking and MIS Reports<br />
                    • Can be restored from "Cancelled Dockets" page<br />
                    • All related data remains in database
                  </p>
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="border-t border-gray-200 p-4 flex gap-3 justify-end">
                <button
                  onClick={closeCancelDialog}
                  disabled={cancelling}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancelDocket}
                  disabled={cancelling || !cancellationReason.trim()}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 flex items-center gap-2"
                >
                  <XCircle size={18} />
                  {cancelling ? 'Cancelling...' : 'CANCEL DOCKET'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}