// Add this to your TotalBooking.jsx

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import * as XLSX from 'xlsx';

export default function TotalBooking() {
  const [dockets, setDockets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  // Calculate pending days
  const calculatePendingDays = (expectedDate) => {
    if (!expectedDate) return '-';
    const today = new Date();
    const expDate = new Date(expectedDate);
    const diff = Math.floor((today - expDate) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} days` : 'Pending';
  };

  // Fetch dockets from backend
  useEffect(() => {
    const fetchDockets = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/v1/dockets');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dockets: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw API Response:', data);
        
        if (data.success && data.data && Array.isArray(data.data)) {
          const transformedData = data.data.map((item) => {
            const consignor = item.docket?.consignor;
            const consignee = item.docket?.consignee;
            
            return {
              docketNo: item.docket?.docketNo || '-',
              bookingDate: item.docket?.bookingDate ? new Date(item.docket.bookingDate).toLocaleDateString('en-IN') : '-',
              mode: item.bookingInfo?.bookingMode || '-',
              origin: item.bookingInfo?.origin || '-',
              branch: item.bookingInfo?.destinationBranch || '-',
              bookingType: item.bookingInfo?.bookingType || '-',
              destination: item.docket?.destinationCity || '-',
              docketType: item.bookingInfo?.loadType || '-',
              consignerName: typeof consignor === 'object' && consignor !== null ? (consignor.consignorName || '-') : '-',
              consigneeName: typeof consignee === 'object' && consignee !== null ? (consignee.consigneeName || '-') : '-',
              customerType: item.bookingInfo?.customerType || '-',
              expectedDate: item.docket?.expectedDelivery ? new Date(item.docket.expectedDelivery).toLocaleDateString('en-IN') : '-',
              pendingDays: calculatePendingDays(item.docket?.expectedDelivery),
              userLog: item.bookingInfo?.createdBy || '-',
              creationDate: item.docket?.createdAt ? new Date(item.docket.createdAt).toLocaleDateString('en-IN') : '-',
              splBookingRejectStatus: item.bookingInfo?.status || 'Active',
            };
          });
          
          console.log('Transformed Data:', transformedData);
          setDockets(transformedData);
        } else {
          console.warn('Unexpected data structure:', data);
          setError('Unexpected data format from server');
        }
        
        setError('');
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Error fetching dockets');
      } finally {
        setLoading(false);
      }
    };

    fetchDockets();
  }, []);

  // Export to Excel function
  const exportToExcel = () => {
    if (dockets.length === 0) {
      alert('No data to export');
      return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(dockets);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // Docket No
      { wch: 15 }, // Booking Date
      { wch: 12 }, // Mode
      { wch: 20 }, // Origin
      { wch: 15 }, // Branch
      { wch: 15 }, // Booking Type
      { wch: 15 }, // Destination
      { wch: 12 }, // Docket Type
      { wch: 20 }, // Consigner Name
      { wch: 20 }, // Consignee Name
      { wch: 18 }, // Customer Type
      { wch: 15 }, // Expected Date
      { wch: 15 }, // Pending Days
      { wch: 12 }, // UserLog
      { wch: 15 }, // Creation Date
      { wch: 18 }, // Spl. Booking Reject
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dockets');
    
    // Generate file name with current date
    const fileName = `Dockets_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`;
    
    // Write the file
    XLSX.writeFile(workbook, fileName);
  };

  // Pagination
  const totalPages = Math.ceil(dockets.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentDockets = dockets.slice(startIdx, endIdx);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const goToPage = (pageNum) => {
    setCurrentPage(pageNum);
  };

  return (
 <div className="min-h-screen bg-gray-100 p-6">
        {/* Navbar */}
        <Navbar />
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg p-6">
        
        {/* Header with Export Button */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Total Bookings</h1>
            <p className="text-gray-600 mt-2">List of all dockets in the system</p>
          </div>
          <button
            onClick={exportToExcel}
            disabled={loading || dockets.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            <Download size={18} />
            Export to Excel
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            ❌ Error: {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading dockets...</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-blue-600 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Docket No</th>
                    <th className="px-4 py-3 text-left font-semibold">Booking Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Mode</th>
                    <th className="px-4 py-3 text-left font-semibold">Origin</th>
                    <th className="px-4 py-3 text-left font-semibold">Branch</th>
                    <th className="px-4 py-3 text-left font-semibold">Booking Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Destination</th>
                    <th className="px-4 py-3 text-left font-semibold">Docket Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Consigner Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Consignee Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Customer Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Expected Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Pending Days</th>
                    <th className="px-4 py-3 text-left font-semibold">UserLog</th>
                    <th className="px-4 py-3 text-left font-semibold">Creation Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Spl. Booking Reject</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDockets.length > 0 ? (
                    currentDockets.map((docket, idx) => (
                      <tr key={idx} className={`border-b ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition`}>
                        <td className="px-4 py-3 text-gray-800 font-medium">{docket.docketNo}</td>
                        <td className="px-4 py-3 text-gray-700">{docket.bookingDate}</td>
                        <td className="px-4 py-3 text-gray-700">{docket.mode}</td>
                        <td className="px-4 py-3 text-gray-700">{docket.origin}</td>
                        <td className="px-4 py-3 text-gray-700">{docket.branch}</td>
                        <td className="px-4 py-3 text-gray-700">{docket.bookingType}</td>
                        <td className="px-4 py-3 text-gray-700">{docket.destination}</td>
                        <td className="px-4 py-3 text-gray-700">{docket.docketType}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{docket.consignerName}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{docket.consigneeName}</td>
                        <td className="px-4 py-3 text-gray-700">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            {docket.customerType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{docket.expectedDate}</td>
                        <td className="px-4 py-3 text-gray-700">
                          <span className={`${docket.pendingDays.includes('days') ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
                            {docket.pendingDays}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{docket.userLog}</td>
                        <td className="px-4 py-3 text-gray-700">{docket.creationDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${docket.splBookingRejectStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {docket.splBookingRejectStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="16" className="px-4 py-8 text-center text-gray-500">
                        No dockets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {dockets.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{startIdx + 1}</span> to <span className="font-semibold">{Math.min(endIdx, dockets.length)}</span> of <span className="font-semibold">{dockets.length}</span> dockets
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-2 rounded text-sm font-medium transition ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}