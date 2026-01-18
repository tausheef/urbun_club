import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import Navbar from "../components/Navbar";
import * as XLSX from "xlsx";

export default function TotalBooking() {
  const navigate = useNavigate();
  const [dockets, setDockets] = useState([]);
  const [filteredDockets, setFilteredDockets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  const rowsPerPage = 6;

  // ================= PENDING DAYS =================
  const calculatePendingDays = (expectedDate) => {
    if (!expectedDate) return "-";
    const today = new Date();
    const expDate = new Date(expectedDate);
    const diff = Math.floor((today - expDate) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} days` : "Pending";
  };

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchDockets = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/v1/dockets");
        const data = await res.json();

        if (!data.success || !Array.isArray(data.data)) {
          throw new Error("Invalid data format");
        }

        const transformed = data.data.map((item) => {
          const consignor = item.docket?.consignor;
          const consignee = item.docket?.consignee;

          return {
            id: item.docket?._id || null,
            docketNo: item.docket?.docketNo || "-",
            bookingDate: item.docket?.bookingDate
              ? new Date(item.docket.bookingDate).toLocaleDateString("en-IN")
              : "-",
            mode: item.bookingInfo?.bookingMode || "-",
            origin: item.bookingInfo?.origin || "-",
            branch: item.bookingInfo?.destinationBranch || "-",
            bookingType: item.bookingInfo?.bookingType || "-",
            destination: item.docket?.destinationCity || "-",
            docketType: item.bookingInfo?.loadType || "-",
            consignerName: consignor?.consignorName || "-",
            consigneeName: consignee?.consigneeName || "-",
            customerType: item.bookingInfo?.customerType || "-",
            expectedDate: item.docket?.expectedDelivery
              ? new Date(item.docket.expectedDelivery).toLocaleDateString("en-IN")
              : "-",
            pendingDays: calculatePendingDays(item.docket?.expectedDelivery),
            userLog: item.bookingInfo?.createdBy || "-",
            creationDate: item.docket?.createdAt
              ? new Date(item.docket.createdAt).toLocaleDateString("en-IN")
              : "-",
            createdAtRaw: item.docket?.createdAt || null,
            splBookingRejectStatus: item.bookingInfo?.status || "Active",
          };
        });

        setDockets(transformed);
        setFilteredDockets(transformed);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDockets();
  }, []);

  // ================= FILTER =================
  const applyMonthYearFilter = () => {
    if (!filterMonth || !filterYear) {
      setFilteredDockets(dockets);
      setCurrentPage(1);
      setIsFilterApplied(false);
      return;
    }

    const filtered = dockets.filter((item) => {
      if (!item.createdAtRaw) return false;
      const d = new Date(item.createdAtRaw);
      return (
        d.getMonth() + 1 === Number(filterMonth) &&
        d.getFullYear() === Number(filterYear)
      );
    });

    setFilteredDockets(filtered);
    setCurrentPage(1);
    setIsFilterApplied(true);
  };

  // ================= CLEAR FILTER =================
  const clearFilter = () => {
    setFilterMonth("");
    setFilterYear("");
    setFilteredDockets(dockets);
    setCurrentPage(1);
    setIsFilterApplied(false);
  };

  // ================= EXPORT =================
  const exportToExcel = () => {
    if (filteredDockets.length === 0) return;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filteredDockets);
    XLSX.utils.book_append_sheet(wb, ws, "Dockets");
    XLSX.writeFile(wb, "Dockets.xlsx");
  };

  // ================= PAGINATION =================
  const totalPages = Math.ceil(filteredDockets.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const currentDockets = filteredDockets.slice(
    startIdx,
    startIdx + rowsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="px-6 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Total Bookings</h1>
              <p className="text-gray-500 text-sm">List of all dockets in the system</p>
            </div>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
            >
              <Download size={18} />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by:</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("en-IN", { month: "long" })}
                  </option>
                ))}
              </select>

              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Year</option>
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                onClick={applyMonthYearFilter}
                disabled={!filterMonth || !filterYear}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply Filter
              </button>

              {isFilterApplied && (
                <button
                  onClick={clearFilter}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <X size={16} />
                  Clear Filter
                </button>
              )}
            </div>

            {isFilterApplied && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">
                  Filtered by: <span className="font-semibold">{new Date(0, filterMonth - 1).toLocaleString("en-IN", { month: "long" })} {filterYear}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Docket No</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Booking Date</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Mode</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Origin</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Branch</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Booking Type</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Destination</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Docket Type</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Consigner Name</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Consignee Name</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Customer Type</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Expected Date</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Pending Days</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">UserLog</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Creation Date</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Spl. Booking Reject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentDockets.length > 0 ? (
                    currentDockets.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td 
                          className="px-4 py-3.5 text-sm font-medium text-blue-700 underline cursor-pointer whitespace-nowrap"
                          onClick={() => d.id && navigate(`/update-docket/${d.id}`)}
                        >
                          {d.docketNo}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.bookingDate}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.mode}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.origin}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.branch}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.bookingType}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.destination}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.docketType}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.consignerName}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.consigneeName}</td>
                        <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                          <span className="text-purple-600 font-medium">{d.customerType}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.expectedDate}</td>
                        <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                          {d.pendingDays !== "-" && d.pendingDays !== "Pending" ? (
                            <span className="text-red-600 font-medium">{d.pendingDays}</span>
                          ) : (
                            <span className="text-gray-700">{d.pendingDays}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.userLog}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">{d.creationDate}</td>
                        <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {d.splBookingRejectStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="16" className="px-4 py-8 text-center text-gray-500">
                        No dockets found for the selected filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with Pagination */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {filteredDockets.length > 0 ? startIdx + 1 : 0} to {Math.min(startIdx + rowsPerPage, filteredDockets.length)} of {filteredDockets.length} dockets
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {totalPages > 0 && [...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === idx + 1
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}