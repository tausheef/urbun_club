import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { docketAPI } from "../utils/api";

export default function HtmlToPdf() {
  const { id } = useParams();
  const [docketData, setDocketData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
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

  // Get dimensions array (handle both old single object and new array format)
  const dimensionsArray = Array.isArray(docket?.dimensions) 
    ? docket.dimensions 
    : docket?.dimensions 
      ? [docket.dimensions] 
      : [];

  // Calculate total packages from all dimensions
  const totalPackets = dimensionsArray.reduce((sum, dim) => sum + (parseFloat(dim.noOfPackets) || 0), 0);

  return (
    <>
      {/* Template Container - A4 Landscape dimensions */}
      <div className="relative w-[1123px] h-[794px] mx-auto my-4 bg-white print:m-0 shadow-lg">
        
        {/* Background Template Image */}
        <img 
          src="/lorry-receipt-template.png" 
          alt="Lorry Receipt Template" 
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* ==================== DATA OVERLAY ==================== */}
        
        {/* CONSIGNMENT NOTE NUMBER (Large number on right) */}
        <div className="absolute" style={{top: '150px', left: '880px'}}>
          <span className="text-3xl font-bold">{docket?.docketNo || "0005011"}</span>
        </div>

        {/* RIGHT COLUMN FIELDS */}
        
        {/* NO. */}
        <div className="absolute" style={{top: '235px', left: '950px'}}>
          <span className="text-[9px]"></span>
        </div>

        {/* DATE - Docket Creation Date */}
        <div className="absolute" style={{top: '192px', left: '893px'}}>
          <span className="text-[17px] font-semibold">{formatDate(docket?.createdAt)}</span>
        </div>

        <div className="absolute" style={{top: '226px', left: '489px'}}>
          <span className="text-[10px] font-semibold">{formatDate(docket?.createdAt)}</span>
        </div>

        {/* TRUCK NO. */}
        <div className="absolute" style={{top: '269px', left: '950px'}}>
          <span className="text-[9px]"></span>
        </div>

        {/* GST NO. */}
        <div className="absolute" style={{top: '286px', left: '950px'}}>
          <span className="text-[9px]"></span>
        </div>

        {/* CST NO. */}
        <div className="absolute" style={{top: '303px', left: '950px'}}>
          <span className="text-[9px]"></span>
        </div>

        {/* INVOICE No. */}
        <div className="absolute" style={{top: '330px', left: '930px'}}>
          <span className="text-[17px] font-semibold">{invoice?.invoiceNo || "INV99000"}</span>
        </div>

        {/* VALUE Rs. */}
        <div className="absolute" style={{top: '500px', left: '930px'}}>
          <span className="text-[17px] font-semibold">{"54000"}/-</span>
        </div>

        {/* PRIVATE MARK */}
        <div className="absolute" style={{top: '354px', left: '950px'}}>
          <span className="text-[9px]"></span>
        </div>

        {/* BRANCH CODE No. */}
        <div className="absolute" style={{top: '371px', left: '950px'}}>
          <span className="text-[9px]"></span>
        </div>

        {/* DATE OF DELIVERY */}
        <div className="absolute" style={{top: '388px', left: '950px'}}>
          <span className="text-[9px]"></span>
        </div>

        {/* M.R. No. */}
        <div className="absolute" style={{top: '471px', left: '950px'}}>
          <span className="text-[9px]"></span>
        </div>

        {/* ADDRESS OF DELIVERY OFFICE - Phone */}
        <div className="absolute" style={{top: '321px', left: '575px'}}>
          <span className="text-[20px] font-semibold">{docket?.consignee?.phone || "08409045674"}</span>
        </div>

        {/* FROM */}
        <div className="absolute" style={{top: '405px', left: '599px', maxWidth: '100px'}}>
          <span className="text-[17px] font-semibold">{bookingInfo?.originCity}</span>
        </div>

        {/* TO */}
        <div className="absolute" style={{top: '448px', left: '599px', maxWidth: '100px'}}>
          <span className="text-[17px] font-semibold">{docket?.destinationCity || "Darbhanga"}</span>
        </div>

        {/* ==================== CONSIGNOR'S NAME & ADDRESS ==================== */}
        
        {/* Consignor Name */}
        <div className="absolute" style={{top: '278px', left: '225px', maxWidth: '360px'}}>
          <div className="text-[17px] font-semibold">
            {docket?.consignor?.consignorName || "ramesh mahto"}
          </div>
        </div>

        {/* Consignor Address Line 1 */}
        <div className="absolute" style={{top: '318px', left: '60px', maxWidth: '500px'}}>
          <div className="text-[11px] font-semibold">
            {docket?.consignor?.address || "Ward No. 08, Village- Mohiuddinpur, Hansa, Samastipur, Bihar, 848101"}
          </div>
        </div>

        {/* Consignor City, State, Pin */}
        <div className="absolute" style={{top: '350px', left: '60px', maxWidth: '360px'}}>
          <div className="text-[11px] font-semibold">
            {docket?.consignor?.city || "DELHI"}, {docket?.consignor?.state || "DELHI"} - {docket?.consignor?.pin || "110046"}
          </div>
        </div>

        {/* Consignor Phone */}
        <div className="absolute" style={{top: '353px', left: '430px', maxWidth: '360px'}}>
          <div className="text-[13px] font-semibold">
            Ph: {docket?.consignor?.phone || "08409062277"}
          </div>
        </div>

        {/* ==================== CONSIGNEE NAME & ADDRESS ==================== */}
        
        {/* Consignee Name */}
        <div className="absolute" style={{top: '380px', left: '216px', maxWidth: '280px'}}>
          <div className="text-[17px] font-semibold">
            {docket?.consignee?.consigneeName || "mandal kumar"}
          </div>
        </div>

        {/* Consignee Address Line 1 */}
        <div className="absolute" style={{top: '420px', left: '60px', maxWidth: '280px'}}>
          <div className="text-[10px] font-semibold">
            {docket?.consignee?.address}
          </div>
        </div>

        {/* Consignee City, State, Pin */}
        <div className="absolute" style={{top: '452px', left: '130px', maxWidth: '280px'}}>
          <div className="text-[13px] font-semibold">
            {docket?.consignee?.city}, {docket?.consignee?.state} - {docket?.consignee?.pin}
          </div>
        </div>

        {/* Consignee Phone */}
        <div className="absolute" style={{top: '453px', left: '430px', maxWidth: '280px'}}>
          <div className="text-[13px] font-semibold">
            Ph: {docket?.consignee?.phone}
          </div>
        </div>

        {/* ==================== PACKAGES SECTION ==================== */}
        
        {/* Total Packages */}
        <div className="absolute" style={{top: '520px', left: '72px', maxWidth: '420px'}}>
          <div className="text-[24px] font-semibold">
           {totalPackets || invoice?.packet || "14"}
          </div>
        </div>

        {/* Description */}
        <div className="absolute" style={{top: '511px', left: '150px', maxWidth: '420px'}}>
          <div className="text-[13px] font-semibold">
            Description: {invoice?.itemDescription}
          </div>
        </div>

        {/* Weight */}
        <div className="absolute" style={{top: '521px', left: '512px', maxWidth: '420px'}}>
          <div className="text-[20px] font-semibold">
           {invoice?.weight}kg 
          </div>
        </div>

        {/* Display ALL dimensions from array */}
        {dimensionsArray.length > 0 && (
          <div className="absolute" style={{top: '525px', left: '149px', maxWidth: '420px'}}>
            <div className="text-[15px] font-bold space-y-1">
              {dimensionsArray.map((dim, index) => (
                <div key={index}>
                  {dim.length} x {dim.width} x {dim.height} -- {dim.noOfPackets} Pkg
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== CHARGES ==================== */}
        
        {/* ST. CHARGES - Rs */}
        <div className="absolute" style={{top: '571px', left: '965px'}}>
          <span className="text-[9px]">100</span>
        </div>

        {/* ST. CHARGES - Ps */}
        <div className="absolute" style={{top: '571px', left: '1015px'}}>
          <span className="text-[9px]">00</span>
        </div>

      </div>

      {/* Print Button - Centered at Bottom */}
      <div className="flex justify-center my-6 print:hidden">
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
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
        }
      `}} />
    </>
  );
}