import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useMisReportsStore } from '../stores/misReportsStore';
import Navbar from '../components/Navbar';

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

  // ✅ Check if any result has co-loader to show/hide columns
  const hasAnyCoLoader = useMemo(() => {
    return searchResults.some(result => result.hasCoLoader);
  }, [searchResults]);

  const handleSearch = async () => {
    await searchByClient(clientType, clientName);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    clearSearch();
    setCurrentPage(1);
  };

  // ✅ Export to Excel with co-loader columns
  const exportToExcel = () => {
    if (searchResults.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for Excel with co-loader columns
    const excelData = searchResults.map(result => {
      const baseData = {
        'SLNO': result.slno,
        'DATE': result.date,
        'DOCKET NO': result.docketNo,
        'CONSIGNEE': result.consignee,
        'CONSIGNOR': result.consignor,
        'FROM': result.from,
        'TO': result.to,
        'INVOICE NO': result.invoiceNo,
        'PKG': result.pkg,
        'WEIGHT': result.weight,
        'MODE': result.mode,
        'STATUS': result.status,
        'DELIVERY DATE': result.deliveryDate,
      };

      // ✅ Add co-loader columns if any docket has co-loader
      if (hasAnyCoLoader) {
        baseData['TRANSPORT NAME'] = result.transportName;
        baseData['TP DOCKET'] = result.transportDocket;
      }

      baseData['POD'] = result.pod ? 'View POD' : 'No POD';

      return baseData;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Add hyperlinks to POD column
    const podColumnIndex = hasAnyCoLoader ? 'P' : 'N'; // Adjust based on co-loader columns
    searchResults.forEach((result, index) => {
      if (result.pod) {
        const cellAddress = `${podColumnIndex}${index + 2}`;
        worksheet[cellAddress].l = { Target: result.pod, Tooltip: 'Click to view POD' };
      }
      
      // Add hyperlinks to Docket No column
      if (result.docketId) {
        const docketCellAddress = `C${index + 2}`;
        const docketUrl = `http://localhost:5173/html-to-pdf/${result.docketId}`;
        worksheet[docketCellAddress].l = { Target: docketUrl, Tooltip: 'Click to view docket details' };
      }
    });

    // Set column widths
    const columnWidths = [
      { wch: 6 },   // SLNO
      { wch: 12 },  // DATE
      { wch: 12 },  // DOCKET NO
      { wch: 20 },  // CONSIGNEE
      { wch: 20 },  // CONSIGNOR
      { wch: 15 },  // FROM
      { wch: 15 },  // TO
      { wch: 15 },  // INVOICE NO
      { wch: 8 },   // PKG
      { wch: 12 },  // WEIGHT
      { wch: 10 },  // MODE
      { wch: 18 },  // STATUS
      { wch: 14 },  // DELIVERY DATE
    ];

    // ✅ Add co-loader column widths if present
    if (hasAnyCoLoader) {
      columnWidths.push({ wch: 20 }); // TRANSPORT NAME
      columnWidths.push({ wch: 15 }); // TP DOCKET
    }

    columnWidths.push({ wch: 12 }); // POD

    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'MIS Report');
    const fileName = `MISReport_${clientName}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Pagination
  const totalPages = Math.ceil(searchResults.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentResults = searchResults.slice(startIdx, endIdx);

  const hasSearched = searchResults.length > 0 || (clientName && !loading);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="p-6">
        <div className="max-w-full mx-auto">
          {/* MIS Report Header */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6 rounded-lg shadow-sm">
            <h1 className="text-3xl font-bold text-gray-800">MIS Report</h1>
            <p className="text-gray-600 mt-1">Management Information System - Docket Details</p>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Client Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
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
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="consignor" className="ml-2 text-sm text-gray-700 cursor-pointer font-medium">
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
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="consignee" className="ml-2 text-sm text-gray-700 cursor-pointer font-medium">
                      Consignee
                    </label>
                  </div>
                </div>
              </div>

              {/* Client Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Client Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder={`Enter ${clientType} Name`}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 items-end">
                <button
                  onClick={handleSearch}
                  disabled={loading || !clientName.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                >
                  {loading ? '🔍 Searching...' : 'SEARCH'}
                </button>
                <button
                  onClick={handleClearSearch}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2.5 px-6 rounded-lg transition-colors"
                >
                  CLEAR
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Results Section */}
          {hasSearched && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Export Button */}
              {searchResults.length > 0 && (
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="text-gray-700 font-semibold">
                    📊 Found {searchResults.length} record{searchResults.length !== 1 ? 's' : ''} for{' '}
                    <span className="text-blue-600">{clientName}</span>
                    {hasAnyCoLoader && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                        🚛 Includes Co-Loader Data
                      </span>
                    )}
                  </div>
                  <button
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Download size={18} />
                    EXPORT TO EXCEL
                  </button>
                </div>
              )}

              {/* No Results */}
              {searchResults.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500 text-lg font-medium">No records found for "{clientName}"</p>
                  <p className="text-gray-400 text-sm mt-2">Try searching with a different client name</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      {/* ✅ UPDATED: Table header with conditional co-loader columns */}
                      <thead className="bg-teal-600 text-white sticky top-0">
                        <tr>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">SLNO</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">DATE</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">DOCKET NO</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">CONSIGNEE</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">CONSIGNOR</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">FROM</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">TO</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">INVOICE NO</th>
                          <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wide">PKG</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">WEIGHT</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">MODE</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">STATUS</th>
                          <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide">DELIVERY DATE</th>
                          {/* ✅ Conditional Co-Loader Columns */}
                          {hasAnyCoLoader && (
                            <>
                              <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide bg-orange-600">TRANSPORT NAME</th>
                              <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wide bg-orange-600">TP DOCKET</th>
                            </>
                          )}
                          <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wide">POD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentResults.map((result, idx) => (
                          <tr 
                            key={idx} 
                            className={`border-b border-gray-200 ${
                              idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                            } hover:bg-blue-50 transition-colors`}
                          >
                            <td className="px-4 py-3.5 text-gray-800 font-semibold">{result.slno}</td>
                            <td className="px-4 py-3.5 text-gray-700">{result.date}</td>
                            <td className="px-4 py-3.5">
                              {result.docketId ? (
                                <Link
                                  to={`/html-to-pdf/${result.docketId}`}
                                  className="text-blue-700 hover:text-blue-900 font-semibold underline transition-colors"
                                  title="View Docket Details"
                                >
                                  {result.docketNo}
                                </Link>
                              ) : (
                                <span className="text-blue-700 font-semibold">{result.docketNo}</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-gray-700">{result.consignee}</td>
                            <td className="px-4 py-3.5 text-gray-700">{result.consignor}</td>
                            <td className="px-4 py-3.5 text-gray-700">{result.from}</td>
                            <td className="px-4 py-3.5 text-gray-700">{result.to}</td>
                            <td className="px-4 py-3.5 text-gray-700">{result.invoiceNo}</td>
                            <td className="px-4 py-3.5 text-center text-gray-800 font-medium">{result.pkg}</td>
                            <td className="px-4 py-3.5 text-gray-700">{result.weight}</td>
                            <td className="px-4 py-3.5 text-gray-700 font-medium">{result.mode}</td>
                            <td className="px-4 py-3.5">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                result.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                result.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-800' :
                                result.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800' :
                                result.status === 'Booked' ? 'bg-purple-100 text-purple-800' :
                                result.status === 'Undelivered' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {result.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-gray-700">{result.deliveryDate}</td>
                            {/* ✅ Conditional Co-Loader Data Columns */}
                            {hasAnyCoLoader && (
                              <>
                                <td className="px-4 py-3.5 text-gray-700 bg-orange-50">
                                  {result.hasCoLoader ? (
                                    <span className="font-medium">{result.transportName}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-gray-700 bg-orange-50">
                                  {result.hasCoLoader ? (
                                    <span className="font-medium">{result.transportDocket}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </>
                            )}
                            <td className="px-4 py-3.5 text-center">
                              {result.pod ? (
                                <a
                                  href={result.pod}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-medium underline transition-colors"
                                  title="View Proof of Delivery"
                                >
                                  View POD
                                </a>
                              ) : (
                                <span className="text-gray-400 font-medium">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {searchResults.length > rowsPerPage && (
                    <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
                      <div className="text-sm text-gray-600">
                        Showing <span className="font-semibold text-gray-800">{startIdx + 1}</span> to{' '}
                        <span className="font-semibold text-gray-800">{Math.min(endIdx, searchResults.length)}</span> of{' '}
                        <span className="font-semibold text-gray-800">{searchResults.length}</span> records
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          ← Previous
                        </button>
                        
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'border border-gray-300 hover:bg-gray-100 text-gray-700'
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
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
            <div className="bg-white rounded-lg shadow-md p-16 text-center">
              <div className="text-7xl mb-6">🔍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Search MIS Records</h3>
              <p className="text-gray-500 text-lg">
                Enter a client name and click <span className="font-semibold text-blue-600">SEARCH</span> to view detailed MIS report
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}