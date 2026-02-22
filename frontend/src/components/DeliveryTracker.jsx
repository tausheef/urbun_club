import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deliveryTrackerAPI } from "../utils/api";

export default function DeliveryTracker() {
  const [dockets, setDockets] = useState([]);
  const [filteredDockets, setFilteredDockets] = useState([]);
  const [summary, setSummary] = useState({ total: 0, overdue: 0, deliveringSoon: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "overdue" | "delivering_soon"
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 8;
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filter + reset page
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredDockets(dockets);
    } else {
      setFilteredDockets(dockets.filter((d) => d.status === activeFilter));
    }
    setCurrentPage(1);
  }, [dockets, activeFilter]);

  const fetchData = async () => {
    try {
      const result = await deliveryTrackerAPI.getAll();
      if (result.success) {
        setDockets(result.data);
        setSummary(result.summary || { total: 0, overdue: 0, deliveringSoon: 0 });
      }
    } catch (error) {
      console.error("Error fetching delivery tracker:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "overdue":
        return {
          row: "bg-red-50 hover:bg-red-100",
          badge: "bg-red-100 text-red-800 border border-red-300",
          dot: "bg-red-500",
          label: "Overdue",
          dateColor: "text-red-600",
        };
      case "delivering_soon":
        return {
          row: "bg-yellow-50 hover:bg-yellow-100",
          badge: "bg-yellow-100 text-yellow-800 border border-yellow-300",
          dot: "bg-yellow-500",
          label: "Delivering Soon",
          dateColor: "text-yellow-600",
        };
      default:
        return {
          row: "hover:bg-gray-50",
          badge: "bg-gray-100 text-gray-700 border border-gray-200",
          dot: "bg-gray-400",
          label: "—",
          dateColor: "text-gray-600",
        };
    }
  };

  const getDaysInfo = (docket) => {
    if (docket.status === "overdue") {
      return `${docket.daysOverdue} ${docket.daysOverdue === 1 ? "day" : "days"} overdue`;
    } else {
      return docket.daysRemaining === 0
        ? "Due today"
        : `${docket.daysRemaining} ${docket.daysRemaining === 1 ? "day" : "days"} left`;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredDockets.length / ROWS_PER_PAGE);
  const paginatedDockets = filteredDockets.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Delivery Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                🚚 Delivery Tracker
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Overdue & upcoming deliveries
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            onClick={() => setActiveFilter("all")}
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer border-2 transition-all ${
              activeFilter === "all"
                ? "border-blue-500"
                : "border-transparent hover:border-blue-200"
            }`}
          >
            <div className="text-3xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-gray-500 mt-1">Total Pending</div>
          </div>

          <div
            onClick={() => setActiveFilter("overdue")}
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer border-2 transition-all ${
              activeFilter === "overdue"
                ? "border-red-500"
                : "border-transparent hover:border-red-200"
            }`}
          >
            <div className="text-3xl font-bold text-red-600">{summary.overdue}</div>
            <div className="text-sm text-gray-500 mt-1">🔴 Overdue</div>
          </div>

          <div
            onClick={() => setActiveFilter("delivering_soon")}
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer border-2 transition-all ${
              activeFilter === "delivering_soon"
                ? "border-yellow-500"
                : "border-transparent hover:border-yellow-200"
            }`}
          >
            <div className="text-3xl font-bold text-yellow-600">{summary.deliveringSoon}</div>
            <div className="text-sm text-gray-500 mt-1">🟡 Delivering Soon</div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          {["all", "overdue", "delivering_soon"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === f
                  ? f === "overdue"
                    ? "bg-red-500 text-white"
                    : f === "delivering_soon"
                    ? "bg-yellow-500 text-white"
                    : "bg-blue-500 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              {f === "all" ? "All" : f === "overdue" ? "Overdue" : "Delivering Soon"}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400">
            Showing{" "}
            {filteredDockets.length === 0
              ? 0
              : (currentPage - 1) * ROWS_PER_PAGE + 1}
            –{Math.min(currentPage * ROWS_PER_PAGE, filteredDockets.length)} of{" "}
            {filteredDockets.length} record
            {filteredDockets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {filteredDockets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Records Found
            </h2>
            <p className="text-gray-500">
              No dockets match the selected filter.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Docket No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Consignor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Consignee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Booking Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Expected Delivery
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Days Info
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Latest Activity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedDockets.map((docket) => {
                      const style = getStatusStyle(docket.status);
                      return (
                        <tr
                          key={docket._id}
                          className={`transition-colors ${style.row}`}
                        >
                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.badge}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${style.dot}`}
                              ></span>
                              {style.label}
                            </span>
                          </td>

                          {/* Docket No */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {docket.docketNo}
                            </div>
                          </td>

                          {/* Consignor */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {docket.consignor}
                            </div>
                          </td>

                          {/* Consignee */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {docket.consignee}
                            </div>
                          </td>

                          {/* Route */}
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-700">
                              <div className="font-medium">{docket.originCity}</div>
                              <div className="text-gray-400 text-xs">↓</div>
                              <div>{docket.destinationCity}</div>
                            </div>
                          </td>

                          {/* Booking Date */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {formatDate(docket.bookingDate)}
                            </div>
                          </td>

                          {/* Expected Delivery */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className={`text-sm font-medium ${style.dateColor}`}>
                              {formatDate(docket.expectedDelivery)}
                            </div>
                          </td>

                          {/* Days Info */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.badge}`}
                            >
                              {getDaysInfo(docket)}
                            </span>
                          </td>

                          {/* Latest Activity */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-500 max-w-[120px] truncate">
                              {docket.latestStatus}
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() =>
                                navigate(`/view-docket/${docket._id}`)
                              }
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium underline underline-offset-2"
                            >
                              View →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-md mt-4 px-6 py-3 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page{" "}
                  <span className="font-medium text-gray-700">{currentPage}</span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700">{totalPages}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                    )
                    .reduce((acc, page, idx, arr) => {
                      if (idx > 0 && page - arr[idx - 1] > 1) acc.push("...");
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "..." ? (
                        <span
                          key={`dots-${idx}`}
                          className="px-2 py-1.5 text-sm text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            currentPage === item
                              ? "bg-blue-500 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    »
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