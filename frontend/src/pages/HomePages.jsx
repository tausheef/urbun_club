import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useDocketStore } from '../stores/docketStore';
import { useSearchStore } from '../stores/searchStore';

export default function HomePage() {
  const navigate = useNavigate();
  
  // Get data from Zustand stores
  const { fetchDockets, fetchInvoices, getTotalDockets, getEWayBillCount, loading } = useDocketStore();
  const { searchResults, searchQuery, searchType, loading: searchLoading, clearSearch } = useSearchStore();

  // ✅ NEW: E-way Bill expiry notification state
  const [expiredCount, setExpiredCount] = useState(0);

  // Fetch dockets and invoices on component mount
  useEffect(() => {
    fetchDockets();
    fetchInvoices();
    fetchExpiredCount(); // ✅ NEW: Fetch expired count
    
    // ✅ NEW: Refresh expired count every 5 minutes
    const interval = setInterval(() => {
      fetchExpiredCount();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ NEW: Fetch expired E-way Bills count
  const fetchExpiredCount = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/v1/ewaybills/expired/count");
      const result = await response.json();
      
      if (result.success) {
        setExpiredCount(result.count);
      }
    } catch (error) {
      console.error("Error fetching expired count:", error);
    }
  };

  // ✅ NEW: Handle notification click
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
    { label: 'DELIVERED', value: 288, path: null },
    { label: 'UNDELIVERED', value: 0, path: null },
    { label: 'PENDING', value: 3657, path: null },
    { label: 'RTO', value: 3083, path: null },
    { label: 'PROOF OF DELIVERY', value: 0, path: null },
  ];

  const handleItemClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  // Show search results if there's a search query
  const isSearching = searchQuery.trim() !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-center text-2xl font-light text-gray-600 mb-8">User Dashboard</h1>

        {/* Search Results Section */}
        {isSearching && (
          <div className="mb-8">
            <div className="bg-white rounded shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {searchType} Search Results
                </h2>
                <button
                  onClick={clearSearch}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear Search
                </button>
              </div>

              {searchLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Searching...</p>
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && (
                <p className="text-center py-8 text-gray-500">No results found for "{searchQuery}"</p>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </p>

                  {searchType === 'DOCKET' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Docket No</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Booking Date</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Origin</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Destination</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Consignor</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Consignee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.slice(0, 5).map((item, idx) => (
                            <tr
                              key={idx}
                              onClick={() => navigate(`/update-docket/${item.docket._id}`)}
                              className="border-b hover:bg-blue-50 cursor-pointer"
                            >
                              <td className="px-4 py-2 font-medium text-blue-700 underline">
                                {item.docket?.docketNo || '-'}
                              </td>
                              <td className="px-4 py-2">
                                {item.docket?.bookingDate
                                  ? new Date(item.docket.bookingDate).toLocaleDateString('en-IN')
                                  : '-'}
                              </td>
                              <td className="px-4 py-2">{item.bookingInfo?.originCity || '-'}</td>
                              <td className="px-4 py-2">{item.docket?.destinationCity || '-'}</td>
                              <td className="px-4 py-2">{item.docket?.consignor?.consignorName || '-'}</td>
                              <td className="px-4 py-2">{item.docket?.consignee?.consigneeName || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {searchType === 'E-WAY BILL' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">E-WayBill</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Invoice No</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Item Description</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Invoice Date</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Net Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.slice(0, 5).map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-800 font-medium">{item.eWayBill || '-'}</td>
                              <td className="px-4 py-2 text-gray-700">{item.invoiceNo || '-'}</td>
                              <td className="px-4 py-2 text-gray-700">{item.itemDescription || '-'}</td>
                              <td className="px-4 py-2 text-gray-700">
                                {item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString('en-IN') : '-'}
                              </td>
                              <td className="px-4 py-2 text-gray-700">₹ {item.netInvoiceValue?.toLocaleString('en-IN') || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {searchResults.length > 5 && (
                    <p className="text-sm text-gray-600 text-center mt-4">
                      Showing 5 of {searchResults.length} results
                    </p>
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

      {/* ✅ UPDATED: E-Way Bill Validity Notification (Only shows if expired count > 0) */}
      {expiredCount > 0 && (
        <button
          onClick={handleExpiredClick}
          className="fixed bottom-6 right-6 z-50 bg-gray-800 hover:bg-gray-900 text-white rounded-lg shadow-2xl p-4 transition-all hover:scale-105 flex flex-col items-center gap-1 min-w-[120px]"
          title="Click to view expired E-way Bills"
        >
          {/* Badge with count */}
          <div className="relative">
            <span className="text-4xl font-bold text-red-500">-{expiredCount}</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* Label */}
          <div className="text-center">
            <div className="text-xs font-semibold">E-Way Bill</div>
            <div className="text-xs">Validity</div>
          </div>

          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-lg border-2 border-red-500 animate-ping opacity-20"></div>
        </button>
      )}

      {/* Footer */}
      <div className="text-center py-8 text-gray-500 text-sm mt-12">
        <p>All Rights Reserved @ 2025 | <span className="text-blue-600 font-medium">Urban Club Pvt. Ltd.</span></p>
      </div>
    </div>
  );
}