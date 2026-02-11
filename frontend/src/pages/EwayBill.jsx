import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { invoiceAPI } from '../utils/api';

export default function EwayBill() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  // Fetch invoices from backend
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const data = await invoiceAPI.getAll();
        
        console.log('Raw API Response:', data);
        
        if (Array.isArray(data)) {
          // Filter invoices that have eWayBill
          const invoicesWithEWayBill = data
            .filter(item => item.eWayBill && item.eWayBill.trim() !== '')
            .map(item => ({
              eWayBill: item.eWayBill || '-',
              invoiceNo: item.invoiceNo || '-',
              invoiceDate: item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString('en-IN') : '-',
              netInvoiceValue: item.netInvoiceValue || 0,
              grossInvoiceValue: item.grossInvoiceValue || 0,
              partNo: item.partNo || '-',
              itemDescription: item.itemDescription || '-',
              weight: item.weight || 0,
              packet: item.packet || 0,
            }));
          
          console.log('Filtered Invoices:', invoicesWithEWayBill);
          setInvoices(invoicesWithEWayBill);
        } else {
          console.warn('Unexpected data structure:', data);
          setError('Unexpected data format from server');
        }
        
        setError('');
      } catch (err) {
        console.error('Fetch error:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Error fetching invoices';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Export to Excel function
  const exportToExcel = () => {
    if (invoices.length === 0) {
      alert('No data to export');
      return;
    }

    const workbook = XLSX.utils.book_new();
    
    const worksheet = XLSX.utils.json_to_sheet(invoices);
    
    const columnWidths = [
      { wch: 15 }, // E-WayBill
      { wch: 15 }, // Inv. No.
      { wch: 15 }, // Inv. Date
      { wch: 15 }, // Net Inv Value
      { wch: 15 }, // G.Inv Value
      { wch: 15 }, // Part No.
      { wch: 20 }, // Item Des.
      { wch: 12 }, // Weight
      { wch: 12 }, // Packet
    ];
    worksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'E-Way Bills');
    
    const fileName = `EwayBills_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  // Pagination
  const totalPages = Math.ceil(invoices.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentInvoices = invoices.slice(startIdx, endIdx);

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
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg p-6">
        
        {/* Header with Export Button */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">E-Way Bills</h1>
            <p className="text-gray-600 mt-2">List of all e-way bills in the system</p>
          </div>
          <button
            onClick={exportToExcel}
            disabled={loading || invoices.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            <Download size={18} />
            Export to Excel
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading e-way bills...</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-blue-600 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">E-WayBill</th>
                    <th className="px-4 py-3 text-left font-semibold">Inv. No.</th>
                    <th className="px-4 py-3 text-left font-semibold">Inv. Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Net Inv Value</th>
                    <th className="px-4 py-3 text-left font-semibold">G.Inv Value</th>
                    <th className="px-4 py-3 text-left font-semibold">Part No.</th>
                    <th className="px-4 py-3 text-left font-semibold">Item Des.</th>
                    <th className="px-4 py-3 text-left font-semibold">Weight</th>
                    <th className="px-4 py-3 text-left font-semibold">Packet</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoices.length > 0 ? (
                    currentInvoices.map((invoice, idx) => (
                      <tr key={idx} className={`border-b ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition`}>
                        <td className="px-4 py-3 text-gray-800 font-medium">{invoice.eWayBill}</td>
                        <td className="px-4 py-3 text-gray-700">{invoice.invoiceNo}</td>
                        <td className="px-4 py-3 text-gray-700">{invoice.invoiceDate}</td>
                        <td className="px-4 py-3 text-gray-700">₹ {invoice.netInvoiceValue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-700">₹ {invoice.grossInvoiceValue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-700">{invoice.partNo}</td>
                        <td className="px-4 py-3 text-gray-700">{invoice.itemDescription}</td>
                        <td className="px-4 py-3 text-gray-700 text-center">{invoice.weight} kg</td>
                        <td className="px-4 py-3 text-gray-700 text-center">{invoice.packet}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                        No e-way bills found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {invoices.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{startIdx + 1}</span> to <span className="font-semibold">{Math.min(endIdx, invoices.length)}</span> of <span className="font-semibold">{invoices.length}</span> e-way bills
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