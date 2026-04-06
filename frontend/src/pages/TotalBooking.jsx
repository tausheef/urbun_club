import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Download, X } from "lucide-react";
import Navbar from "../components/Navbar";
import * as XLSX from "xlsx";
import { docketAPI } from "../utils/api";

export default function TotalBooking() {
  const navigate = useNavigate();

  // ── Server-side pagination state ──
  const [dockets, setDockets]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalCount, setTotalCount]     = useState(0);
  const rowsPerPage = 8;

  // ── Filter state ──
  const [filterDay,   setFilterDay]     = useState("");
  const [filterMonth, setFilterMonth]   = useState("");
  const [filterYear,  setFilterYear]    = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ day: "", month: "", year: "" });
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  // ── Activity statuses map ──
  const [activityStatuses, setActivityStatuses] = useState({});

  const handleDocketClick = (docketId) => {
    if (!docketId) return;
    navigate(`/view-docket/${docketId}`);
  };

  // ================= FETCH PAGE =================
  const fetchPage = useCallback(async (page, filters = appliedFilters) => {
    try {
      setLoading(true);
      setError("");

      const data = await docketAPI.getPaginated({
        page,
        limit: rowsPerPage,
        day:   filters.day,
        month: filters.month,
        year:  filters.year,
      });

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error("Invalid data format");
      }

      // Build activityStatuses map from latestStatus in response
      const statusMap = {};
      data.data.forEach((item) => {
        const id = item.docket?._id;
        if (id) statusMap[id] = item.latestStatus || "-";
      });
      setActivityStatuses(statusMap);

      setDockets(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total      || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch dockets");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  // Initial load
  useEffect(() => {
    fetchPage(1, { day: "", month: "", year: "" });
  }, []);

  // ================= APPLY FILTER =================
  const applyFilter = () => {
    if (!filterYear) return; // year required
    const filters = { day: filterDay, month: filterMonth, year: filterYear };
    setAppliedFilters(filters);
    setIsFilterApplied(true);
    fetchPage(1, filters);
  };

  // ================= CLEAR FILTER =================
  const clearFilter = () => {
    setFilterDay("");
    setFilterMonth("");
    setFilterYear("");
    const filters = { day: "", month: "", year: "" };
    setAppliedFilters(filters);
    setIsFilterApplied(false);
    fetchPage(1, filters);
  };

  // ================= PAGE CHANGE =================
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchPage(page, appliedFilters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ================= EXPORT =================
  // Export fetches ALL matching dockets (no page limit) for complete Excel export
  const exportToExcel = async () => {
    try {
      // Fetch all pages by using a large limit
      const data = await docketAPI.getPaginated({
        page:  1,
        limit: 9999,
        day:   appliedFilters.day,
        month: appliedFilters.month,
        year:  appliedFilters.year,
      });

      if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
        alert("No data to export");
        return;
      }

      const exportRows = data.data.map((item, i) => ({
        "#":            i + 1,
        "Docket No":    item.docket?.docketNo || "-",
        "Booking Date": item.docket?.bookingDate
          ? new Date(item.docket.bookingDate).toLocaleDateString("en-IN") : "-",
        "Delivery":     item.docket?.expectedDelivery
          ? new Date(item.docket.expectedDelivery).toLocaleDateString("en-IN") : "-",
        "Mode":         item.bookingInfo?.bookingMode || "-",
        "From":         item.bookingInfo?.originCity  || "-",
        "To":           item.docket?.destinationCity  || "-",
        "Consignor":    item.docket?.consignor?.consignorName || "-",
        "Consignee":    item.docket?.consignee?.consigneeName || "-",
        "Status":       item.latestStatus || "-",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(wb, ws, "Dockets");
      XLSX.writeFile(wb, "Dockets.xlsx");
    } catch (err) {
      alert("Export failed: " + err.message);
    }
  };

  // ================= RENDER =================
  const startIdx = (currentPage - 1) * rowsPerPage;

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
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={18} />
              Export to Excel
            </button>

            <div className="h-6 w-px bg-gray-300"></div>

            {/* Day */}
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Month */}
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

            {/* Year */}
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Year</option>
              {[2023, 2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={applyFilter}
              disabled={!filterYear}
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
            <div className="mt-2">
              <span className="text-sm text-gray-600">
                Filtered by:{" "}
                <span className="font-semibold">
                  {appliedFilters.day   ? `${appliedFilters.day} `   : ""}
                  {appliedFilters.month ? `${new Date(0, appliedFilters.month - 1).toLocaleString("en-IN", { month: "long" })} ` : ""}
                  {appliedFilters.year}
                </span>
                {" "}— <span className="font-semibold text-blue-600">{totalCount} dockets</span>
              </span>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading dockets...</p>
          </div>
        )}

        {/* Error */}
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
                  {dockets.length > 0 ? (
                    dockets.map((item, i) => {
                      const d          = item.docket;
                      const isCoLoader = d?.coLoader === true;
                      const docketId   = d?._id;
                      const status     = activityStatuses[docketId] || "-";

                      const statusColor =
                        status === "Delivered"   ? "bg-green-100 text-green-700"  :
                        status === "Undelivered" ? "bg-red-100 text-red-700"      :
                        status === "In Transit"  ? "bg-blue-100 text-blue-700"    :
                        status === "Booked"      ? "bg-gray-100 text-gray-600"    :
                        status === "On Hold"     ? "bg-yellow-100 text-yellow-700":
                        "bg-purple-100 text-purple-700";

                      return (
                        <tr
                          key={docketId || i}
                          className={`transition-colors ${
                            isCoLoader
                              ? "bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-400"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {startIdx + i + 1}
                          </td>

                          <td
                            className="px-4 py-3 whitespace-nowrap cursor-pointer"
                            onClick={() => handleDocketClick(docketId)}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline">
                                {d?.docketNo || "-"}
                              </span>
                              {isCoLoader && (
                                <span className="text-xs bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded font-semibold">
                                  🚛 CL
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {d?.bookingDate ? new Date(d.bookingDate).toLocaleDateString("en-IN") : "-"}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {d?.expectedDelivery ? new Date(d.expectedDelivery).toLocaleDateString("en-IN") : "-"}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                              {item.bookingInfo?.bookingMode || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {item.bookingInfo?.originCity || "-"}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {d?.destinationCity || "-"}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {d?.consignor?.consignorName || "-"}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {d?.consignee?.consigneeName || "-"}
                          </td>

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
                        No dockets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold text-gray-800">{currentPage}</span> of{" "}
                <span className="font-semibold text-gray-800">{totalPages}</span>
                <span className="ml-2 text-gray-400">({totalCount} total)</span>
              </div>

              <div className="flex items-center gap-1">
                {/* « First */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm text-gray-600"
                >«</button>

                {/* ‹ Prev */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm text-gray-600"
                >‹ Prev</button>

                {/* Smart windowed page numbers */}
                {(() => {
                  const pages = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (currentPage > 3) pages.push("...");
                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                      pages.push(i);
                    }
                    if (currentPage < totalPages - 2) pages.push("...");
                    pages.push(totalPages);
                  }
                  return pages.map((p, idx) =>
                    p === "..." ? (
                      <span key={`e-${idx}`} className="px-2 py-2 text-sm text-gray-400 select-none">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === p
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >{p}</button>
                    )
                  );
                })()}

                {/* Next › */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm text-gray-600"
                >Next ›</button>

                {/* » Last */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-2 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm text-gray-600"
                >»</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}