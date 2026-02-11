import React, { useState, useEffect } from 'react';
import { RotateCcw, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { docketAPI } from '../utils/api';

export default function CancelledDockets() {
  const [cancelledDockets, setCancelledDockets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch cancelled dockets on mount
  useEffect(() => {
    fetchCancelledDockets();
  }, []);

  const fetchCancelledDockets = async () => {
    setLoading(true);
    try {
      const data = await docketAPI.getCancelled();

      if (data.success) {
        setCancelledDockets(data.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setMessage('❌ Error loading cancelled dockets');
    } finally {
      setLoading(false);
    }
  };

  // Restore docket
  const handleRestore = async (docketId, docketNo) => {
    if (!window.confirm(`Are you sure you want to restore Docket ${docketNo}?`)) {
      return;
    }

    try {
      const data = await docketAPI.restore(docketId);

      if (data.success) {
        setMessage(`✅ Docket ${docketNo} restored successfully`);
        
        // Remove from list
        setCancelledDockets(prev => 
          prev.filter(d => d._id !== docketId)
        );

        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Restore error:', error);
      const errorMessage = error.response?.data?.message || 'Error restoring docket';
      alert(`❌ ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cancelled dockets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-gray-800 text-white p-6 mb-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <XCircle size={32} />
            <div>
              <h1 className="text-2xl font-bold">Cancelled Dockets</h1>
              <p className="text-gray-300 text-sm mt-1">
                View and restore cancelled dockets (Admin Only)
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Table */}
        {cancelledDockets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <XCircle size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Cancelled Dockets</h3>
            <p className="text-gray-600">All dockets are active</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            
            {/* Table Header */}
            <div className="bg-red-600 text-white p-4">
              <h2 className="text-lg font-bold">
                Total Cancelled: {cancelledDockets.length}
              </h2>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Docket No</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Consignor</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Consignee</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Cancelled On</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Cancelled By</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Reason</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelledDockets.map((docket, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {docket.docketNo}
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          CANCELLED
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {docket.consignor?.consignorName || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {docket.consignee?.consigneeName || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {docket.cancelledAt 
                          ? new Date(docket.cancelledAt).toLocaleDateString('en-IN') 
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {docket.cancelledBy?.username || docket.cancelledBy?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={docket.cancellationReason}>
                        {docket.cancellationReason || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRestore(docket._id, docket.docketNo)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <RotateCcw size={14} />
                          RESTORE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}