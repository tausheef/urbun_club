import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { docketAPI } from "../utils/api";
import LORRY_RECEIPT_TEMPLATE from "../utils/Lorryreceipttemplate";

export default function HtmlToPdf() {
  const { id } = useParams();
  const [docketData, setDocketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(false);

  useEffect(() => {
    const fetchDocketData = async () => {
      try {
        const result = await docketAPI.getById(id);
        setDocketData(result.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching docket:", error);
        setLoading(false);
      }
    };
    if (id) fetchDocketData();
  }, [id]);

  const handlePrint = () => window.print();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading docket data...</div>
      </div>
    );
  }

  if (!docketData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Failed to load docket data</div>
      </div>
    );
  }

  const { docket, bookingInfo, invoice } = docketData;

  const dimensionsArray = Array.isArray(docket?.dimensions)
    ? docket.dimensions
    : docket?.dimensions
    ? [docket.dimensions]
    : [];

  const totalPackets = dimensionsArray.reduce(
    (sum, dim) => sum + (parseFloat(dim.noOfPackets) || 0),
    0
  );

  return (
    <>
      {/* A4 Landscape container: 1123 x 794 px */}
      <div className="relative w-[1123px] h-[794px] mx-auto my-4 bg-white print:m-0 shadow-lg overflow-hidden">

        {/* High-res template */}
        <img
          src={LORRY_RECEIPT_TEMPLATE}
          alt="Lorry Receipt Template"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "fill" }}
        />

        {/* CONSIGNMENT NOTE NUMBER */}
        <div className="absolute" style={{ top: "165px", left: "903px" }}>
          <span className="text-3xl font-bold" style={{ fontFamily: "Arial, sans-serif" }}>
            {docket?.docketNo}
          </span>
        </div>

        {/* DATE (top-right) — Booking Date */}
        <div className="absolute" style={{ top: "204px", left: "908px" }}>
          <span className="text-[17px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {formatDate(docket?.bookingDate)}
          </span>
        </div>

        {/* DATE (mid-section small) */}
        <div className="absolute" style={{ top: "234px", left: "510px" }}>
          <span className="text-[10px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {formatDate(docket?.bookingDate)}
          </span>
        </div>

        {/* O/R — static text next to PLOC NO. */}
        <div className="absolute" style={{ top: "234px", left: "420px" }}>
          <span className="text-[17px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            O/R
          </span>
        </div>

        {/* INVOICE No. */}
        <div className="absolute" style={{ top: "332px", left: "937px" }}>
          <span className="text-[15px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {invoice?.invoiceNo}
          </span>
        </div>

        {/* VALUE Rs. */}
        <div className="absolute" style={{ top: "491px", left: "933px" }}>
          <span className="text-[17px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {invoice?.grossInvoiceValue}/-
          </span>
        </div>

        {/* DELIVERY MODE — under ADDRESS OF DELIVERY OFFICE */}
        <div className="absolute" style={{ top: "209px", left: "630px" }}>
          <span className="text-[13px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {bookingInfo?.deliveryMode}
          </span>
        </div>

        {/* ADDRESS OF DELIVERY OFFICE — Consignee Phone */}
        <div className="absolute" style={{ top: "319px", left: "599px" }}>
          <span className="text-[20px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {docket?.consignee?.phone}
          </span>
        </div>

        {/* FROM */}
        <div className="absolute" style={{ top: "405px", left: "619px", maxWidth: "100px" }}>
          <span className="text-[17px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {bookingInfo?.originCity}
          </span>
        </div>

        {/* TO */}
        <div className="absolute" style={{ top: "444px", left: "619px", maxWidth: "100px" }}>
          <span className="text-[17px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {docket?.destinationCity}
          </span>
        </div>

        {/* DATE OF DELIVERY — Expected Delivery */}
        <div className="absolute" style={{ top: "425px", left: "936px" }}>
          <span className="text-[13px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {formatDate(docket?.expectedDelivery)}
          </span>
        </div>

        {/* ── CONSIGNOR ── */}

        <div className="absolute" style={{ top: "290px", left: "257px", maxWidth: "360px" }}>
          <div className="text-[12px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {docket?.consignor?.consignorName}
          </div>
        </div>

        <div className="absolute" style={{ top: "322px", left: "88px", maxWidth: "500px" }}>
          <div className="text-[12px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {docket?.consignor?.address}
          </div>
        </div>

        <div className="absolute" style={{ top: "355px", left: "88px", maxWidth: "360px" }}>
          <div className="text-[11px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {docket?.consignor?.city}{" , "}
            {docket?.consignor?.state}{" - "}
            {docket?.consignor?.pin}
          </div>
        </div>

        {/* ── CONSIGNEE ── */}

        <div className="absolute" style={{ top: "385px", left: "247px", maxWidth: "280px" }}>
          <div className="text-[12px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {docket?.consignee?.consigneeName}
          </div>
        </div>

        <div className="absolute" style={{ top: "417px", left: "87px", maxWidth: "280px" }}>
          <div className="text-[12px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {docket?.consignee?.address}
          </div>
        </div>

        <div className="absolute" style={{ top: "449px", left: "87px", maxWidth: "280px" }}>
          <div className="text-[12px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {docket?.consignee?.city}, {docket?.consignee?.state} -{" "}
            {docket?.consignee?.pin}
          </div>
        </div>

        {/* ── PACKAGES ── */}

        <div className="absolute" style={{ top: "510px", left: "95px", maxWidth: "420px" }}>
          <div className="text-[24px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {invoice?.packet}
          </div>
        </div>

        <div className="absolute" style={{ top: "658px", left: "290px", maxWidth: "420px" }}>
          <div className="text-[13px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {invoice?.itemDescription}
          </div>
        </div>

        <div className="absolute" style={{ top: "521px", left: "445px", maxWidth: "420px" }}>
          <div className="text-[20px] font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            {invoice?.weight}kg
          </div>
        </div>

        {dimensionsArray.length > 0 && (
          <div className="absolute" style={{ top: "505px", left: "149px", maxWidth: "420px" }}>
            <div className="text-[13px] font-bold space-y-1" style={{ fontFamily: "Arial, sans-serif" }}>
              {dimensionsArray.map((dim, index) => (
                <div key={index}>
                  {dim.length} x {dim.width} x {dim.height} - {dim.noOfPackets} Pkg
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SIGNATURE (toggled by button) ── */}
        {showSignature && (
          <div className="absolute" style={{ top: "590px", left: "893px" }}>
            <img
              src="/sign.png"
              alt="Signature"
              style={{ width: "170px", height: "111px", objectFit: "contain" }}
            />
          </div>
        )}

      </div>

      {/* ── BUTTONS (hidden on print) ── */}
      <div className="flex justify-center gap-4 my-6 print:hidden">

        {/* Signature Toggle Button */}
        <button
          onClick={() => setShowSignature((prev) => !prev)}
          className={`font-bold px-6 py-4 rounded-lg shadow-xl flex items-center gap-2 text-lg transition-all hover:scale-105 ${
            showSignature
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {showSignature ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Remove Signature
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Add Signature
            </>
          )}
        </button>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-lg shadow-xl flex items-center gap-3 text-lg transition-all hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print / Download PDF
        </button>

      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:m-0 { margin: 0 !important; }
        }
      `}} />
    </>
  );
}