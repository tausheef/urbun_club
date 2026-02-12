import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { activityAPI } from '../utils/api';

export default function Undelivered() {
  const navigate = useNavigate();
  const [dockets, setDockets] = useState([]);
  const [filteredDockets, setFilteredDockets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUndeliveredDockets();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDockets(dockets);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = dockets.filter((item) => {
        const docketNo = item.docket?.docketNo?.toLowerCase() || '';
        const consignor = item.docket?.consignor?.consignorName?.toLowerCase() || '';
        const consignee = item.docket?.consignee?.consigneeName?.toLowerCase() || '';
        const origin = item.bookingInfo?.originCity?.toLowerCase() || '';
        const destination = item.docket?.destinationCity?.toLowerCase() || '';
        
        return (
          docketNo.includes(query) ||
          consignor.includes(query) ||
          consignee.includes(query) ||
          origin.includes(query) ||
          destination.includes(query)
        );
      });
      setFilteredDockets(filtered);
    }
  }, [searchQuery, dockets]);

  const fetchUndeliveredDockets = async () => {
    setLoading(true);
    try {
      const result = await activityAPI.getUndelivered();

      if (result.success) {
        setDockets(result.data);
        setFilteredDockets(result.data);
      }
    } catch (error) {
      console.error("Error fetching undelivered dockets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocketClick = (docketId) => {
    navigate(`/view-docket/${docketId}`);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Undelivered Dockets</h1>
          <p className="text-gray-600 mt-1">All dockets marked as undelivered</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by Docket No, Consignor, Consignee, Origin, or Destination..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={fetchUndeliveredDockets}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Undelivered</p>
              <p className="text-3xl font-bold text-red-600">
                {loading ? '...' : filteredDockets.length}
              </p>
            </div>
            {searchQuery && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Showing Results</p>
                <p className="text-xl font-semibold text-gray-800">
                  {filteredDockets.length} of {dockets.length}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading undelivered dockets...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredDockets.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? `No undelivered dockets found matching "${searchQuery}"`
                : 'No undelivered dockets found'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filteredDockets.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Docket No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Booking Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Expected
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Consignor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Consignee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Origin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDockets.map((item, idx) => {
                    const latestActivity = item.activities?.[0];
                    
                    return (
                      <tr
                        key={idx}
                        onClick={() => item.docket?._id && handleDocketClick(item.docket._id)}
                        className="hover:bg-blue-50 cursor-pointer transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-blue-600 font-medium underline">
                            {item.docket?.docketNo || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.docket?.bookingDate
                            ? new Date(item.docket.bookingDate).toLocaleDateString('en-IN')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.docket?.expectedDeliveryDate
                            ? new Date(item.docket.expectedDeliveryDate).toLocaleDateString('en-IN')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.docket?.consignor?.consignorName || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.docket?.consignee?.consigneeName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.bookingInfo?.originCity || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.docket?.destinationCity || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {latestActivity?.status || 'Undelivered'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}