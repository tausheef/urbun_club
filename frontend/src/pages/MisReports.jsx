import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useMisReportsStore } from '../stores/misReportsStore';

export default function MisReports() {
  const {
    clientType,
    clientName,
    searchResults,
    loading,
    error,
    setClientType,
    setClientName,
    searchByClient,
    clearSearch,
  } = useMisReportsStore();

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const handleSearch = async () => {
    await searchByClient(clientType, clientName);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    clearSearch();
    setCurrentPage(1);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (searchResults.length === 0) {
      alert('No data to export');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(searchResults);

    const columnWidths = [
      { wch: 8 },   // SLNO
      { wch: 12 },  // Booking Date
      { wch: 12 },  // Docket No
      { wch: 20 },  // Consignor
      { wch: 20 },  // Consignee
      { wch: 20 },  // Billing Party
      { wch: 15 },  // Origin City
      { wch: 15 },  // Destination City
      { wch: 18 },  // Origin Branch
      { wch: 18 },  // Destination Branch
      { wch: 12 },  // Packets Actual
      { wch: 15 },  // Type Booking
      { wch: 15 },  // E-Way Bill No
      { wch: 15 },  // Invoice No
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'MIS Report');
    const fileName = `MISReport_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Pagination
  const totalPages = Math.ceil(searchResults.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentResults = searchResults.slice(startIdx, endIdx);

  const hasSearched = searchResults.length > 0 || (clientName && !loading);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        {/* MIS Report Header */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6 rounded">
          <h1 className="text-2xl font-bold text-gray-800">MIS Report</h1>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Client Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Type
              </label>
              <div className="flex gap-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="consignor"
                    name="clientType"
                    value="Consignor"
                    checked={clientType === 'Consignor'}
                    onChange={(e) => setClientType(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="consignor" className="ml-2 text-sm text-gray-700 cursor-pointer">
                    Consignor
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="consignee"
                    name="clientType"
                    value="Consignee"
                    checked={clientType === 'Consignee'}
                    onChange={(e) => setClientType(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="consignee" className="ml-2 text-sm text-gray-700 cursor-pointer">
                    Consignee
                  </label>
                </div>
              </div>
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-end gap-3">
              <button
                onClick={handleSearch}
                disabled={!clientName.trim() || loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-gray-400 transition"
              >
                {loading ? 'Searching...' : 'SEARCH'}
              </button>
              {hasSearched && (
                <button
                  onClick={handleClearSearch}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Searching records...</p>
          </div>
        )}

        {/* MIS Detail Section */}
        {hasSearched && !loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header */}
            <div className="bg-blue-50 border-b-2 border-blue-600 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-blue-600">MIS Detail</h2>
              {searchResults.length > 0 && (
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition"
                >
                  <Download size={18} />
                  EXPORT TO EXCEL
                </button>
              )}
            </div>

            {/* Table */}
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No records found for "{clientName}"
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-teal-600 text-white sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">SLNO</th>
                        <th className="px-4 py-3 text-left font-semibold">Booking Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Docket No</th>
                        <th className="px-4 py-3 text-left font-semibold">Consignor</th>
                        <th className="px-4 py-3 text-left font-semibold">Consignee</th>
                        <th className="px-4 py-3 text-left font-semibold">Billing Party</th>
                        <th className="px-4 py-3 text-left font-semibold">Origin City</th>
                        <th className="px-4 py-3 text-left font-semibold">Destination City</th>
                        <th className="px-4 py-3 text-left font-semibold">Origin Branch</th>
                        <th className="px-4 py-3 text-left font-semibold">Destination Branch</th>
                        <th className="px-4 py-3 text-left font-semibold">Packets</th>
                        <th className="px-4 py-3 text-left font-semibold">Type Booking</th>
                        <th className="px-4 py-3 text-left font-semibold">E-Way Bill No</th>
                        <th className="px-4 py-3 text-left font-semibold">Invoice No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentResults.map((result, idx) => (
                        <tr key={idx} className={`border-b ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition`}>
                          <td className="px-4 py-3 text-gray-800 font-medium">{result.slno}</td>
                          <td className="px-4 py-3 text-gray-700">{result.bookingDate}</td>
                          <td className="px-4 py-3 text-gray-800 font-medium">{result.docketNo}</td>
                          <td className="px-4 py-3 text-gray-700">{result.consignor}</td>
                          <td className="px-4 py-3 text-gray-700">{result.consignee}</td>
                          <td className="px-4 py-3 text-gray-700">{result.billingParty}</td>
                          <td className="px-4 py-3 text-gray-700">{result.originCity}</td>
                          <td className="px-4 py-3 text-gray-700">{result.destinationCity}</td>
                          <td className="px-4 py-3 text-gray-700">{result.originBranch}</td>
                          <td className="px-4 py-3 text-gray-700">{result.destinationBranch}</td>
                          <td className="px-4 py-3 text-gray-700 text-center">{result.packetsActual}</td>
                          <td className="px-4 py-3 text-gray-700">{result.typeBooking}</td>
                          <td className="px-4 py-3 text-gray-700">{result.ewayBillNo}</td>
                          <td className="px-4 py-3 text-gray-700">{result.invoiceNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {searchResults.length > rowsPerPage && (
                  <div className="border-t border-gray-200 p-4 flex justify-between items-center bg-gray-50">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold">{startIdx + 1}</span> to{' '}
                      <span className="font-semibold">{Math.min(endIdx, searchResults.length)}</span> of{' '}
                      <span className="font-semibold">{searchResults.length}</span> records
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Prev
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-2 py-1 rounded text-sm ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && !loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Enter client name and click SEARCH to view MIS details</p>
          </div>
        )}
      </div>
    </div>
  );
}