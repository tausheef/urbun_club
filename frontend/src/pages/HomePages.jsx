import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useDocketStore } from '../stores/docketStore';
import { useSearchStore } from '../stores/searchStore';
import { ewayBillAPI, activityAPI } from '../utils/api';

export default function HomePage() {
  const navigate = useNavigate();
  
  // Get data from Zustand stores
  const { fetchDockets, fetchInvoices, getTotalDockets, getEWayBillCount, loading } = useDocketStore();
  const { searchResults, searchQuery, searchType, loading: searchLoading, clearSearch, hasSearched } = useSearchStore();

  // E-way Bill expiry notification state
  const [expiredCount, setExpiredCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);

  // Dynamic counts for status pages
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [undeliveredCount, setUndeliveredCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [rtoCount, setRtoCount] = useState(0);
  const [podCount, setPodCount] = useState(0);

  // Fetch dockets and invoices on component mount
  useEffect(() => {
    fetchDockets();
    fetchInvoices();
    fetchExpiredCount();
    fetchStatusCounts();
    
    // Refresh expired count every 5 minutes
    const interval = setInterval(() => {
      fetchExpiredCount();
      fetchStatusCounts();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch expired + expiring soon E-way Bills count
  const fetchExpiredCount = async () => {
    // Fetch separately so one failure doesn't block the other
    try {
      const expiredResult = await ewayBillAPI.getExpiredCount();
      if (expiredResult?.success) {
        setExpiredCount(expiredResult.count ?? 0);
      }
    } catch (error) {
      console.error("Error fetching expired count:", error);
    }

    try {
      const expiringSoonResult = await ewayBillAPI.getExpiringSoonCount();
      // Handle both {success, count} and {success, data:[...]} response shapes
      if (expiringSoonResult?.success) {
        const count =
          expiringSoonResult.count ??
          expiringSoonResult.data?.length ??
          0;
        setExpiringSoonCount(count);
      }
    } catch (error) {
      console.error("Error fetching expiring soon count:", error);
    }
  };

  // Fetch status counts using activity-based endpoints
  const fetchStatusCounts = async () => {
    try {
      // Fetch from activity-based endpoints
      const [delivered, undelivered, pending, rto] = await Promise.all([
        activityAPI.getDelivered(),
        activityAPI.getUndelivered(),
        activityAPI.getPending(),
        activityAPI.getRTO(),
      ]);

      setDeliveredCount(delivered.success ? delivered.count : 0);
      setUndeliveredCount(undelivered.success ? undelivered.count : 0);
      setPendingCount(pending.success ? pending.count : 0);
      setRtoCount(rto.success ? rto.count : 0);
      // POD count is same as delivered count (since POD is for delivered dockets)
      setPodCount(delivered.success ? delivered.count : 0);
    } catch (error) {
      console.error("Error fetching status counts:", error);
    }
  };

  // Handle notification click
  const handleExpiredClick = () => {
    navigate("/expired-ewaybills");
  };

  // Get total dockets and e-way bill count
  const totalDockets = getTotalDockets();
  const totalEWayBill = getEWayBillCount();

  const listItems = [
    { label: 'DOCKET ENTRY',  path: '/DocketEntry' },
    { label: 'TOTAL BOOKING', value: totalDockets, path: '/totalbooking', dynamic: true },
    { label: 'MIS REPORTS',  path: '/misreports' },
    { label: 'E-WAY BILL', value: totalEWayBill, path: '/ewaybill', dynamic: true },
    { label: 'DELIVERED', value: deliveredCount, path: '/delivered', dynamic: true },
    { label: 'UNDELIVERED', value: undeliveredCount, path: '/undelivered', dynamic: true },
    { label: 'PENDING', value: pendingCount, path: '/pending', dynamic: true },
    { label: 'RTO', value: rtoCount, path: '/rto', dynamic: true },
    { label: 'PROOF OF DELIVERY', value: podCount, path: '/proofofdelivery', dynamic: true },
  ];

  const handleItemClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  // ✅ UPDATED: Show search results only if user has performed a search
  const isSearching = hasSearched && searchQuery.trim() !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-center text-2xl font-light text-gray-600 mb-8">User Dashboard</h1>

        {/* ✅ UPDATED: Search Results Section - Only shows after search is executed */}
        {isSearching && (
          <div className="mb-8">
            <div className="bg-white rounded shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {searchType} Search Results
                  {!searchLoading && searchResults.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({searchResults.length} result{searchResults.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h2>
                <button
                  onClick={clearSearch}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
                >
                  Clear Search
                </button>
              </div>

              {/* Loading State */}
              {searchLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600 font-medium">Searching {searchType}...</p>
                </div>
              )}

              {/* No Results */}
              {!searchLoading && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-3">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No results found</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Try searching with different keywords for "{searchQuery}"
                  </p>
                </div>
              )}

              {/* Results Found */}
              {!searchLoading && searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchType === 'DOCKET' && (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Docket No</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Booking Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Origin</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Destination</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Consignor</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Consignee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {searchResults.slice(0, 10).map((item, idx) => (
                            <tr
                              key={idx}
                              onClick={() => navigate(`/view-docket/${item.docket._id}`)}
                              className="hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3 font-medium text-blue-700 hover:text-blue-900 underline">
                                {item.docket?.docketNo || '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {item.docket?.bookingDate
                                  ? new Date(item.docket.bookingDate).toLocaleDateString('en-IN')
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-700">{item.bookingInfo?.originCity || '-'}</td>
                              <td className="px-4 py-3 text-gray-700">{item.docket?.destinationCity || '-'}</td>
                              <td className="px-4 py-3 text-gray-700">{item.docket?.consignor?.consignorName || '-'}</td>
                              <td className="px-4 py-3 text-gray-700">{item.docket?.consignee?.consigneeName || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {searchType === 'E-WAY BILL' && (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">E-Way Bill</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Invoice No</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Item Description</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Invoice Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Net Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {searchResults.slice(0, 10).map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-gray-800 font-medium">{item.eWayBill || '-'}</td>
                              <td className="px-4 py-3 text-gray-700">{item.invoiceNo || '-'}</td>
                              <td className="px-4 py-3 text-gray-700">{item.itemDescription || '-'}</td>
                              <td className="px-4 py-3 text-gray-700">
                                {item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString('en-IN') : '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-700">₹ {item.netInvoiceValue?.toLocaleString('en-IN') || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Show more indicator */}
                  {searchResults.length > 10 && (
                    <div className="text-center pt-2 pb-1">
                      <p className="text-sm text-gray-500">
                        Showing 10 of {searchResults.length} results
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Cards - Show only when not searching */}
        {!isSearching && (
          <div className="bg-white rounded shadow">
            {/* List items */}
            <div className="divide-y divide-gray-200">
              {listItems.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleItemClick(item.path)}
                  className={`px-6 py-4 flex justify-between items-center transition ${
                    item.path 
                      ? 'hover:bg-blue-50 cursor-pointer' 
                      : 'hover:bg-gray-50 cursor-default'
                  }`}
                >
                  <span className={`font-medium ${item.path ? 'text-blue-600' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  <span className="text-gray-900 font-semibold text-lg">
                    {loading && item.dynamic ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : (
                      item.value
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* E-Way Bill Validity Notification (Shows if expiring soon > 0 or expired > 0) */}
      {(expiringSoonCount > 0 || expiredCount > 0) && (
        <button
          onClick={handleExpiredClick}
          className="fixed bottom-6 right-6 z-50 bg-gray-800 hover:bg-gray-900 text-white rounded-lg shadow-2xl p-4 transition-all hover:scale-105 flex flex-col items-center gap-1 min-w-[120px]"
          title="Click to view E-way Bill status"
        >
          {/* Badge with expiring soon count */}
          <div className="relative">
            <span className="text-4xl font-bold text-yellow-400">{expiringSoonCount}</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
          
          {/* Label */}
          <div className="text-center">
            <div className="text-xs font-semibold">E-Way Bill</div>
            <div className="text-xs text-yellow-300">Expiring Soon</div>
          </div>

          {/* Show expired count as sub-label if any */}
          {expiredCount > 0 && (
            <div className="text-xs text-red-400 font-medium">
              +{expiredCount} expired
            </div>
          )}

          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-lg border-2 border-yellow-400 animate-ping opacity-20"></div>
        </button>
      )}

      {/* Footer */}
      <div className="text-center py-8 text-gray-500 text-sm mt-12">
        <p>All Rights Reserved @ 2026 | <span className="text-blue-600 font-medium">Urban Club Pvt. Ltd.</span></p>
      </div>
    </div>
  );
}