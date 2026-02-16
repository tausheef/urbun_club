import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import Navbar from "../components/Navbar";
import * as XLSX from "xlsx";
import { docketAPI, activityAPI } from "../utils/api";

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

  const [activityStatuses, setActivityStatuses] = useState({});
  const rowsPerPage = 8;

  // Everyone goes to ViewDocket (read-only)
  const handleDocketClick = (docketId) => {
    if (!docketId) return;
    navigate(`/view-docket/${docketId}`);
  };

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
        
        const data = await docketAPI.getAll();

        if (!data.success || !Array.isArray(data.data)) {
          throw new Error("Invalid data format");
        }

        // FILTER: Only show Active dockets (hide Cancelled)
        const activeDockets = data.data.filter(
          item => item.docket?.docketStatus !== 'Cancelled'
        );

        const transformed = activeDockets.map((item) => {
          const consignor = item.docket?.consignor;
          const consignee = item.docket?.consignee;

          return {
            id: item.docket?._id || null,
            docketNo: item.docket?.docketNo || "-",
            bookingDate: item.docket?.bookingDate
              ? new Date(item.docket.bookingDate).toLocaleDateString("en-IN")
              : "-",
            expectedDate: item.docket?.expectedDelivery
              ? new Date(item.docket.expectedDelivery).toLocaleDateString("en-IN")
              : "-",
            mode: item.bookingInfo?.bookingMode || "-",
            from: item.bookingInfo?.originCity || item.bookingInfo?.origin || "-",
            to: item.docket?.destinationCity || "-",
            consigneeName: consignee?.consigneeName || "-",
            consignerName: consignor?.consignorName || "-",
            coLoader: item.docket?.coLoader || false,
            createdAtRaw: item.docket?.createdAt || null,
          };
        });

        setDockets(transformed);
        setFilteredDockets(transformed);
        setError("");

        // ✅ Fetch latest activity status for each docket
        const statusMap = {};
        await Promise.all(
          transformed.map(async (d) => {
            if (!d.id) return;
            try {
              const actRes = await activityAPI.getByDocket(d.id);
              if (actRes.success && Array.isArray(actRes.data) && actRes.data.length > 0) {
                // API returns sorted newest first (date: -1, time: -1) → index 0 is latest
                const latest = actRes.data[0];
                statusMap[d.id] = latest.status || "-";
              } else {
                statusMap[d.id] = "-";
              }
            } catch {
              statusMap[d.id] = "-";
            }
          })
        );
        setActivityStatuses(statusMap);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch dockets';
        setError(errorMessage);
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Total Booking</h1>
          <p className="text-gray-600 mt-1">View and manage all dockets</p>
        </div>

        {/* Export & Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={exportToExcel}
              disabled={filteredDockets.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              Export to Excel
            </button>

            <div className="h-6 w-px bg-gray-300"></div>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(0, m - 1).toLocaleString("en-IN", { month: "long" })}
                </option>
              ))}
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="flex items-center gap-2 ml-auto mt-2">
              <span className="text-sm text-gray-600">
                Filtered by: <span className="font-semibold">{new Date(0, filterMonth - 1).toLocaleString("en-IN", { month: "long" })} {filterYear}</span>
              </span>
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading dockets...</p>
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
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">#</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Docket</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Booking Date</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Delivery</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Mode</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">From</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">To</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Consignor</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Consignee</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentDockets.length > 0 ? (
                    currentDockets.map((d, i) => {
                      const status = activityStatuses[d.id] || "-";
                      const isCoLoader = d.coLoader === true;

                      // Status badge color
                      const statusColor =
                        status === "Delivered"   ? "bg-green-100 text-green-700" :
                        status === "Undelivered" ? "bg-red-100 text-red-700" :
                        status === "In Transit"  ? "bg-blue-100 text-blue-700" :
                        status === "Booked"      ? "bg-gray-100 text-gray-600" :
                        status === "On Hold"     ? "bg-yellow-100 text-yellow-700" :
                        "bg-purple-100 text-purple-700";

                      return (
                        <tr
                          key={i}
                          className={`transition-colors ${
                            isCoLoader
                              ? "bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-400"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {/* # serial */}
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {startIdx + i + 1}
                          </td>

                          {/* Docket No - clickable */}
                          <td
                            className="px-4 py-3 whitespace-nowrap cursor-pointer"
                            onClick={() => handleDocketClick(d.id)}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline">
                                {d.docketNo}
                              </span>
                              {isCoLoader && (
                                <span className="text-xs bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded font-semibold">
                                  🚛 CL
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Booking Date */}
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{d.bookingDate}</td>

                          {/* Delivery (Expected) */}
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{d.expectedDate}</td>

                          {/* Mode */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                              {d.mode}
                            </span>
                          </td>

                          {/* From */}
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{d.from}</td>

                          {/* To */}
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{d.to}</td>

                          {/* Consignor */}
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{d.consignerName}</td>

                          {/* Consignee */}
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{d.consigneeName}</td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
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