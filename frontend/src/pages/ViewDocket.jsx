// src/pages/ViewDocket.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { docketAPI, coLoaderAPI } from "../utils/api";

// ✅ Compact Info Field
const InfoField = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
      {label}
    </span>
    <div className="text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 min-h-[34px] flex items-center">
      {value || <span className="text-gray-300 italic">—</span>}
    </div>
  </div>
);

// ✅ Empty Field
const EmptyField = () => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs uppercase tracking-widest text-transparent">-</span>
    <div className="min-h-[34px]"></div>
  </div>
);

// ✅ Section Header
const SectionHeader = ({ icon, title, color = "blue" }) => {
  const styles = {
    blue:   { text: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   grad: "from-blue-600 to-blue-400"   },
    green:  { text: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  grad: "from-green-600 to-green-400"  },
    purple: { text: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", grad: "from-purple-600 to-purple-400" },
    orange: { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", grad: "from-orange-500 to-orange-400" },
    teal:   { text: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-200",   grad: "from-teal-600 to-teal-400"   },
    rose:   { text: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-200",   grad: "from-rose-600 to-rose-400"   },
    gray:   { text: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-200",   grad: "from-gray-600 to-gray-400"   },
  };
  const s = styles[color];
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${s.bg} ${s.border} mb-3`}>
      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.grad} flex items-center justify-center text-white text-sm shadow-sm`}>
        {icon}
      </div>
      <h2 className={`text-xs font-bold uppercase tracking-wider ${s.text}`}>{title}</h2>
    </div>
  );
};

export default function ViewDocket() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [coLoader, setCoLoader] = useState(null);
  const [podUrl, setPodUrl] = useState(null);

  useEffect(() => {
    const fetchDocket = async () => {
      try {
        const result = await docketAPI.getById(id);

        // ✅ api.js: docketAPI.getById returns response.data
        // response.data = { success: true, data: { docket, bookingInfo, invoice } }
        // So result.data = { docket, bookingInfo, invoice }
        // Safety: handle both result.data and result directly
        const payload = result?.data || result;
        const { docket, bookingInfo, invoice } = payload;

        // ✅ consignor/consignee are POPULATED inside docket (not top-level)
        // docket.consignor = { consignorName, address, city, phone, ... }
        // docket.consignee = { consigneeName, address, city, phone, ... }
        const consignor = docket?.consignor;
        const consignee = docket?.consignee;

        setFormData({
          // Docket
          docketNo:         docket?.docketNo || "",
          bookingDate:      docket?.bookingDate?.slice(0, 10) || "",
          destinationCity:  docket?.destinationCity || "",
          postalCode:       docket?.postalCode || "",
          expectedDelivery: docket?.expectedDelivery?.slice(0, 10) || "",
          docketStatus:     docket?.docketStatus || "Active",
          coLoaderFlag:     docket?.coLoader || false,

          // Booking Info (originCity is in bookingInfo)
          customerType:     bookingInfo?.customerType || "",
          bookingMode:      bookingInfo?.bookingMode || "",
          originCity:       bookingInfo?.originCity || bookingInfo?.origin || "",
          billingParty:     bookingInfo?.billingParty || "",
          gstinNo:          bookingInfo?.gstinNo || "",

          // Invoice
          eWayBill:         invoice?.eWayBill || "",
          invNo:            invoice?.invoiceNo || "",
          invDate:          invoice?.invoiceDate?.slice(0, 10) || "",
          partNo:           invoice?.partNo || "",
          itemDesc:         invoice?.itemDescription || "",
          weight:           invoice?.weight || "",
          packet:           invoice?.packet || "",
          netInvValue:      invoice?.netInvoiceValue || "",
          gInvValue:        invoice?.grossInvoiceValue || "",

          // ✅ consignor from docket.consignor (populated ref)
          consignorName:    consignor?.consignorName || "",
          consignorAddress: consignor?.address || "",
          consignorCity:    consignor?.city || "",
          consignorPhone:   consignor?.phone || "",

          // ✅ consignee from docket.consignee (populated ref)
          consigneeName:    consignee?.consigneeName || "",
          consigneeAddress: consignee?.address || "",
          consigneeCity:    consignee?.city || "",
          consigneePhone:   consignee?.phone || "",
        });

        setDimensions(docket?.dimensions || []);

        // ✅ Fetch co-loader if linked
        if (docket?.coLoader) {
          try {
            const coRes = await coLoaderAPI.getByDocketId(id);
            if (coRes.success) setCoLoader(coRes.data);
          } catch (e) {
            console.error("Co-loader fetch error:", e);
          }
        }

        // ✅ Fetch POD from activities
        try {
          const actRes = await fetch(`http://localhost:5000/api/v1/activities/docket/${id}`);
          const actData = await actRes.json();
          if (actData.success && Array.isArray(actData.data)) {
            const withPod = actData.data.find(a => a.podImage?.url);
            if (withPod) setPodUrl(withPod.podImage.url);
          }
        } catch (e) {
          console.error("POD fetch error:", e);
        }

      } catch (err) {
        console.error("Error fetching docket:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocket();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  const handleBack        = () => navigate(-1);
  const handleActivity    = () => navigate(`/update-activity/${id}`);
  const handleDownloadPDF = () => window.open(`/html-to-pdf/${id}`, "_blank");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading docket details...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center bg-white rounded-2xl shadow-lg p-10">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-700 text-lg font-semibold">Docket not found</p>
          <button onClick={handleBack} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ─── STICKY HEADER ─── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-sm">
              <span className="text-white text-lg">📄</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">View Docket</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm text-gray-500">Docket No:</span>
                <span className="text-sm font-bold text-blue-600">{formData.docketNo}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">Read-Only</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  formData.docketStatus === 'Active'    ? 'bg-green-100 text-green-700' :
                  formData.docketStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {formData.docketStatus}
                </span>
                {formData.coLoaderFlag && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold border border-orange-200">
                    🚛 Co-Loader
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleActivity}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
              📍 Activity
            </button>
            <button onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
              📥 PDF
            </button>
            <button onClick={handleBack}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">

        {/* ═══ CARD 1: Docket + Booking ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Docket Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <SectionHeader icon="📦" title="Docket Details" color="blue" />
            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <InfoField label="Docket No"        value={formData.docketNo} />
              <InfoField label="From"      value={formData.originCity} />
              <InfoField label="To" value={formData.destinationCity} />
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-3">
              <InfoField label="Booking Date"      value={formatDate(formData.bookingDate)} />
              <InfoField label="Expected Delivery" value={formatDate(formData.expectedDelivery)} />
              <InfoField label="Postal Code"       value={formData.postalCode} />
            </div>
          </div>

          {/* Booking Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <SectionHeader icon="📋" title="Booking Information" color="purple" />
            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <InfoField label="Customer Type" value={formData.customerType} />
              <InfoField label="Booking Mode"  value={formData.bookingMode} />
              <InfoField label="Billing Party" value={formData.billingParty} />
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-3">
              <InfoField label="Total Weight"       value={formData.weight ? `${formData.weight} kg` : ""} />
              <InfoField label="Packets"            value={formData.packet} />
              <InfoField label="Gross Invoice Value" value={formData.gInvValue ? `₹ ${formData.gInvValue}` : ""} />
            </div>
          </div>
        </div>

        {/* ═══ CARD 2: Invoice Details - ALL 7 in ONE ROW, smaller fields ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <SectionHeader icon="🧾" title="Invoice Details" color="green" />
          <div className="grid grid-cols-7 gap-2">
            <InfoField label="E-way Bill"         value={formData.eWayBill} />
            <InfoField label="Invoice No"         value={formData.invNo} />
            <InfoField label="Invoice Date"       value={formatDate(formData.invDate)} />
            <InfoField label="Net Invoice Value"  value={formData.netInvValue ? `₹${formData.netInvValue}` : ""} />
            <InfoField label="Gross Inv Value"    value={formData.gInvValue ? `₹${formData.gInvValue}` : ""} />
            <InfoField label="Part No"            value={formData.partNo} />
            <InfoField label="GSTIN No"           value={formData.gstinNo} />
          </div>
        </div>

        {/* ═══ CARD 3: Parties - COMPACT HEIGHT ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <SectionHeader icon="👥" title="Parties & Description" color="teal" />
          {/* Row 1 only - no empty row, compact padding */}
          <div className="grid grid-cols-3 gap-3">
            <InfoField label="Consignor Name"  value={formData.consignorName} />
            <InfoField label="Consignee Name"  value={formData.consigneeName} />
            <InfoField label="Item Description" value={formData.itemDesc} />
          </div>
        </div>

        {/* ═══ CARD 4: POD ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <SectionHeader icon="📸" title="POD" color="rose" />
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Docket PDF */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Docket</span>
              <div className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 min-h-[34px] flex items-center">
                <button onClick={handleDownloadPDF}
                  className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1 text-sm">
                  📄 View / Download PDF
                </button>
              </div>
            </div>
            {/* POD Image */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">POD Image</span>
              <div className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 min-h-[34px] flex items-center">
                {podUrl ? (
                  <a href={podUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                    <img src={podUrl} alt="POD" className="h-8 w-12 object-cover rounded border border-gray-300 hover:scale-105 transition-transform" />
                    <span className="underline text-sm">View POD</span>
                  </a>
                ) : (
                  <span className="text-gray-400 italic text-sm">No POD uploaded</span>
                )}
              </div>
            </div>
          </div>
          {/* Row 2 forced empty */}
          {/* <div className="grid grid-cols-2 gap-3">
            <EmptyField /><EmptyField />
          </div> */}
        </div>

        {/* ═══ CARD 5: Co-Loader (only if coLoader === true) ═══ */}
        {formData.coLoaderFlag && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-200 px-4 pt-3 pb-2">
            <SectionHeader icon="🚛" title="Co-Loader Details" color="orange" />
            <div className="grid grid-cols-3 gap-2">
              <InfoField label="TP Docket" value={coLoader?.transportDocket} />
              <InfoField label="TP Name"   value={coLoader?.transportName} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Receipt / Challan</span>
                <div className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 min-h-[34px] flex items-center">
                  {coLoader?.challan?.url ? (
                    <a href={coLoader.challan.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                      <img src={coLoader.challan.url} alt="Challan"
                        className="h-8 w-12 object-cover rounded border border-gray-300 hover:scale-105 transition-transform" />
                      <span className="underline text-sm">View Challan</span>
                    </a>
                  ) : (
                    <span className="text-gray-400 italic text-sm">No challan uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CARD 6: Dimensions ═══ */}
        {dimensions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 pt-3 pb-2">
            <SectionHeader icon="📐" title="Dimensions" color="gray" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="px-3 py-1.5 text-left font-semibold rounded-l-lg">#</th>
                    <th className="px-3 py-1.5 text-left font-semibold">Length</th>
                    <th className="px-3 py-1.5 text-left font-semibold">Width</th>
                    <th className="px-3 py-1.5 text-left font-semibold">Height</th>
                    <th className="px-3 py-1.5 text-left font-semibold rounded-r-lg">No. of Packets</th>
                  </tr>
                </thead>
                <tbody>
                  {dimensions.map((dim, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-1.5 text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-3 py-1.5 text-gray-700">{dim.length || 0}</td>
                      <td className="px-3 py-1.5 text-gray-700">{dim.width || 0}</td>
                      <td className="px-3 py-1.5 text-gray-700">{dim.height || 0}</td>
                      <td className="px-3 py-1.5 text-gray-700">{dim.noOfPackets || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Read Only Notice ─── */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-3">
          <span className="text-lg flex-shrink-0">ℹ️</span>
          <p className="text-blue-700 text-sm">
            This is a <strong>read-only</strong> view. Use <strong>Activity</strong> to add updates or <strong>PDF</strong> to download.
          </p>
        </div>

      </div>
    </div>
  );
}