import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ewayBillAPI } from "../utils/api";

export default function ExpiredEwayBills() {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [summary, setSummary] = useState({ total: 0, expired: 0, expiringSoon: 0, valid: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "expired" | "expiring_soon" | "valid"
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 8;

  // Edit expiry state
  const [editingId, setEditingId] = useState(null);
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllBills();
  }, []);

  // Apply filter whenever bills or activeFilter changes, reset to page 1
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredBills(bills);
    } else {
      setFilteredBills(bills.filter((b) => b.status === activeFilter));
    }
    setCurrentPage(1);
  }, [bills, activeFilter]);

  const fetchAllBills = async () => {
    try {
      const result = await ewayBillAPI.getExpired(); // same API endpoint, now returns all bills

      if (result.success) {
        setBills(result.data);
        setSummary(result.summary || { total: result.data.length, expired: 0, expiringSoon: 0, valid: 0 });
      }
    } catch (error) {
      console.error("Error fetching E-way Bills:", error);
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

  const handleViewDocket = (docketId) => {
    navigate(`/view-docket/${docketId}`);
  };

  // Open edit mode for a specific row
  const handleEditExpiry = (bill) => {
    setEditingId(bill._id);
    // Pre-fill with current expiry date in YYYY-MM-DD format for input[type=date]
    const d = new Date(bill.expiryDate);
    const formatted = d.toISOString().split("T")[0];
    setNewExpiryDate(formatted);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setNewExpiryDate("");
  };

  // Save new expiry date
  const handleSaveExpiry = async (bill) => {
    if (!newExpiryDate) return;
    setSaving(true);
    try {
      const result = await ewayBillAPI.updateExpiry(bill._id, newExpiryDate);
      if (result.success) {
        // Update local state so UI reflects instantly
        setBills((prev) =>
          prev.map((b) => {
            if (b._id !== bill._id) return b;
            const updatedExpiry = new Date(newExpiryDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const threeDaysLater = new Date(today);
            threeDaysLater.setDate(threeDaysLater.getDate() + 3);
            updatedExpiry.setHours(0, 0, 0, 0);

            let status = "valid";
            let daysOverdue = 0;
            let daysRemaining = 0;

            if (updatedExpiry < today) {
              status = "expired";
              daysOverdue = Math.floor((today - updatedExpiry) / (1000 * 60 * 60 * 24));
            } else if (updatedExpiry <= threeDaysLater) {
              status = "expiring_soon";
              daysRemaining = Math.floor((updatedExpiry - today) / (1000 * 60 * 60 * 24));
            } else {
              status = "valid";
              daysRemaining = Math.floor((updatedExpiry - today) / (1000 * 60 * 60 * 24));
            }

            return { ...b, expiryDate: newExpiryDate, status, daysOverdue, daysRemaining };
          })
        );
        setEditingId(null);
        setNewExpiryDate("");
      }
    } catch (error) {
      console.error("Error updating expiry:", error);
      alert("Failed to update expiry date. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Delete (clear) E-way Bill from invoice
  const handleDeleteEwayBill = async (bill) => {
    setDeleting(true);
    try {
      const result = await ewayBillAPI.clearEwayBill(bill._id);
      if (result.success) {
        // Remove from local state instantly
        setBills((prev) => prev.filter((b) => b._id !== bill._id));
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error("Error clearing E-way Bill:", error);
      alert("Failed to clear E-way Bill. Please try again.");
    } finally {
      setDeleting(false);
    }
  };
  const getStatusStyle = (status) => {
    switch (status) {
      case "expired":
        return {
          row: "bg-red-50 hover:bg-red-100",
          badge: "bg-red-100 text-red-800 border border-red-300",
          dot: "bg-red-500",
          label: "Expired",
        };
      case "expiring_soon":
        return {
          row: "bg-yellow-50 hover:bg-yellow-100",
          badge: "bg-yellow-100 text-yellow-800 border border-yellow-300",
          dot: "bg-yellow-500",
          label: "Expiring Soon",
        };
      case "valid":
        return {
          row: "bg-green-50 hover:bg-green-100",
          badge: "bg-green-100 text-green-800 border border-green-300",
          dot: "bg-green-500",
          label: "Valid",
        };
      default:
        return {
          row: "hover:bg-gray-50",
          badge: "bg-gray-100 text-gray-700",
          dot: "bg-gray-400",
          label: "—",
        };
    }
  };

  const getStatusInfo = (bill) => {
    if (bill.status === "expired") {
      return `${bill.daysOverdue} ${bill.daysOverdue === 1 ? "day" : "days"} overdue`;
    } else if (bill.status === "expiring_soon") {
      return bill.daysRemaining === 0
        ? "Expires today"
        : `${bill.daysRemaining} ${bill.daysRemaining === 1 ? "day" : "days"} left`;
    } else {
      return `${bill.daysRemaining} days left`;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredBills.length / ROWS_PER_PAGE);
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading E-way Bills...</p>
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
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                📋 E-way Bill Tracker
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                All E-way Bills with expiry status
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            onClick={() => setActiveFilter("all")}
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer border-2 transition-all ${
              activeFilter === "all" ? "border-blue-500" : "border-transparent hover:border-blue-200"
            }`}
          >
            <div className="text-3xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-gray-500 mt-1">Total E-way Bills</div>
          </div>

          <div
            onClick={() => setActiveFilter("expired")}
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer border-2 transition-all ${
              activeFilter === "expired" ? "border-red-500" : "border-transparent hover:border-red-200"
            }`}
          >
            <div className="text-3xl font-bold text-red-600">{summary.expired}</div>
            <div className="text-sm text-gray-500 mt-1">🔴 Expired</div>
          </div>

          <div
            onClick={() => setActiveFilter("expiring_soon")}
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer border-2 transition-all ${
              activeFilter === "expiring_soon" ? "border-yellow-500" : "border-transparent hover:border-yellow-200"
            }`}
          >
            <div className="text-3xl font-bold text-yellow-600">{summary.expiringSoon}</div>
            <div className="text-sm text-gray-500 mt-1">🟡 Expiring Soon</div>
          </div>

          <div
            onClick={() => setActiveFilter("valid")}
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer border-2 transition-all ${
              activeFilter === "valid" ? "border-green-500" : "border-transparent hover:border-green-200"
            }`}
          >
            <div className="text-3xl font-bold text-green-600">{summary.valid}</div>
            <div className="text-sm text-gray-500 mt-1">🟢 Valid</div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["all", "expired", "expiring_soon", "valid"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === f
                  ? f === "expired"
                    ? "bg-red-500 text-white"
                    : f === "expiring_soon"
                    ? "bg-yellow-500 text-white"
                    : f === "valid"
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "expired"
                ? "Expired"
                : f === "expiring_soon"
                ? "Expiring Soon"
                : "Valid"}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400 self-center">
            Showing {filteredBills.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1}–{Math.min(currentPage * ROWS_PER_PAGE, filteredBills.length)} of {filteredBills.length} record{filteredBills.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Records Found</h2>
            <p className="text-gray-500">No E-way Bills match the selected filter.</p>
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
                      Invoice No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      E-way Bill
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Booking Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Days Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedBills.map((bill) => {
                    const style = getStatusStyle(bill.status);
                    return (
                      <tr key={bill._id} className={`transition-colors ${style.row}`}>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                            {style.label}
                          </span>
                        </td>

                        {/* Docket No */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{bill.docketNo}</div>
                        </td>

                        {/* Invoice No */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{bill.invoiceNo || "—"}</div>
                        </td>

                        {/* E-way Bill */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700 font-mono">{bill.eWayBill}</div>
                        </td>

                        {/* Route */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700">
                            <div className="font-medium">{bill.originCity}</div>
                            <div className="text-gray-400 text-xs">↓</div>
                            <div>{bill.destinationCity}</div>
                          </div>
                        </td>

                        {/* Distance */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{bill.distance} km</div>
                        </td>

                        {/* Booking Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{formatDate(bill.bookingDate)}</div>
                        </td>

                        {/* Expiry Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingId === bill._id ? (
                            <input
                              type="date"
                              value={newExpiryDate}
                              onChange={(e) => setNewExpiryDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-36"
                            />
                          ) : (
                            <div className={`text-sm font-medium flex items-center gap-1.5 ${
                              bill.status === "expired"
                                ? "text-red-600"
                                : bill.status === "expiring_soon"
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}>
                              {formatDate(bill.expiryDate)}
                              {/* Edit pencil - only for expiring_soon */}
                              {bill.status === "expiring_soon" && (
                                <button
                                  onClick={() => handleEditExpiry(bill)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Update expiry date"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Days Info */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                            {getStatusInfo(bill)}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingId === bill._id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveExpiry(bill)}
                                disabled={saving}
                                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs px-2.5 py-1.5 rounded font-medium transition-colors"
                              >
                                {saving ? "..." : "Save"}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2.5 py-1.5 rounded font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : deleteConfirmId === bill._id ? (
                            // Inline confirm for delete
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500">Remove?</span>
                              <button
                                onClick={() => handleDeleteEwayBill(bill)}
                                disabled={deleting}
                                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs px-2 py-1 rounded font-medium transition-colors"
                              >
                                {deleting ? "..." : "Yes"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                disabled={deleting}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded font-medium transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleViewDocket(bill.docketId)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline underline-offset-2"
                              >
                                View →
                              </button>
                              {/* Delete button — only for expired rows */}
                              {bill.status === "expired" && (
                                <button
                                  onClick={() => setDeleteConfirmId(bill._id)}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                  title="Remove E-way Bill (delivered docket)"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-md mt-4 px-6 py-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-700">{currentPage}</span> of{" "}
                <span className="font-medium text-gray-700">{totalPages}</span>
              </p>

              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="First page"
                >
                  «
                </button>

                {/* Prev */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ‹ Prev
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and 1 around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .reduce((acc, page, idx, arr) => {
                    // Insert "..." where pages are skipped
                    if (idx > 0 && page - arr[idx - 1] > 1) {
                      acc.push("...");
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`dots-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">
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

                {/* Next */}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next ›
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Last page"
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