import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useDocketStore } from '../stores/docketStore';
import { useSearchStore } from '../stores/searchStore';

export default function HomePage() {
  const navigate = useNavigate();
  
  // Get data from Zustand stores
  const { fetchDockets, fetchInvoices, getTotalDockets, getEWayBillCount, loading } = useDocketStore();
  const { searchResults, searchQuery, searchType, loading: searchLoading, clearSearch } = useSearchStore();

  // Fetch dockets and invoices on component mount
  useEffect(() => {
    fetchDockets();
    fetchInvoices();
  }, []);

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
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-800 font-medium">{item.docket?.docketNo || '-'}</td>
                              <td className="px-4 py-2 text-gray-700">
                                {item.docket?.bookingDate ? new Date(item.docket.bookingDate).toLocaleDateString('en-IN') : '-'}
                              </td>
                              <td className="px-4 py-2 text-gray-700">{item.bookingInfo?.originCity || '-'}</td>
                              <td className="px-4 py-2 text-gray-700">{item.docket?.destinationCity || '-'}</td>
                              <td className="px-4 py-2 text-gray-700">{item.docket?.consignor?.consignorName || '-'}</td>
                              <td className="px-4 py-2 text-gray-700">{item.docket?.consignee?.consigneeName || '-'}</td>
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

      {/* E-Way Bill Validity Badge */}
      <div className="fixed bottom-8 right-8">
        <div className="bg-gray-700 text-white px-4 py-3 rounded shadow-lg text-center">
          <div className="text-red-500 font-bold text-lg">157</div>
          <div className="text-xs mt-1">E-Way Bill<br />Validity</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-gray-500 text-sm mt-12">
        <p>All Rights Reserved @ 2025 | <span className="text-blue-600 font-medium">Urban Club Pvt. Ltd.</span></p>
      </div>
    </div>
  );
}