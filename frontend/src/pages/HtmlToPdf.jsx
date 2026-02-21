import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { docketAPI } from "../utils/api";
import LORRY_RECEIPT_TEMPLATE from "../utils/Lorryreceipttemplate";
import jsPDF from "jspdf";

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export default function HtmlToPdf() {
  const { id } = useParams();
  const [docketData, setDocketData]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [misStatus, setMisStatus]     = useState(null); // { success, url, error }

  useEffect(() => {
    const fetchDocketData = async () => {
      try {
        const result = await docketAPI.getById(id);
        setDocketData(result.data);
        // Show existing MIS url if already uploaded
        if (result.data?.docket?.misImageUrl) {
          setMisStatus({ success: true, url: result.data.docket.misImageUrl });
        }
      } catch (error) {
        console.error("Error fetching docket:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDocketData();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date  = new Date(dateString);
    const day   = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year  = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Load any image src → base64 JPEG via canvas
  const toBase64 = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width  = img.naturalWidth  || 1123;
        c.height = img.naturalHeight || 794;
        c.getContext("2d").drawImage(img, 0, 0);
        resolve(c.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = reject;
      img.src = src;
    });

  // Load image → base64 PNG (preserves transparency — use for signature)
  const toBase64PNG = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width  = img.naturalWidth  || 170;
        c.height = img.naturalHeight || 111;
        // No background fill — keep transparency
        c.getContext("2d").drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = src;
    });

  // A4 landscape = 297 x 210 mm  |  Preview = 1123 x 794 px
  const mmX = (px) => (px / 1123) * 297;
  const mmY = (px) => (px / 794)  * 210;

  const drawText = (pdf, value, pxLeft, pxTop, ptSize, maxPxWidth) => {
    if (value == null || value === "") return;
    pdf.setFontSize(ptSize);
    pdf.setFont("helvetica", "bold");
    const baseline = ptSize * 0.352778 * 0.78;
    const opts = maxPxWidth ? { maxWidth: mmX(maxPxWidth) } : {};
    pdf.text(String(value), mmX(pxLeft), mmY(pxTop) + baseline, opts);
  };

  // Build jsPDF doc — shared by Download PDF and Upload to MIS
  const buildPDF = async () => {
    const { docket, bookingInfo, invoice } = docketData;
    const dims = Array.isArray(docket?.dimensions)
      ? docket.dimensions
      : docket?.dimensions ? [docket.dimensions] : [];

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.setTextColor(0, 0, 0);

    const bg = await toBase64(LORRY_RECEIPT_TEMPLATE);
    pdf.addImage(bg, "JPEG", 0, 0, 297, 210);

    drawText(pdf, docket?.docketNo,                                           903, 165, 22);
    drawText(pdf, formatDate(docket?.bookingDate),                            908, 204, 13);
    drawText(pdf, formatDate(docket?.bookingDate),                            510, 234,  7);
    drawText(pdf, "O/R",                                                      420, 234, 13);
    drawText(pdf, invoice?.invoiceNo,                                         937, 332, 11);
    drawText(pdf, `${invoice?.grossInvoiceValue ?? ""}/-`,                    933, 491, 13);
    drawText(pdf, bookingInfo?.deliveryMode,                                  630, 209, 10);
    drawText(pdf, docket?.consignee?.phone,                                   599, 319, 15);
    drawText(pdf, bookingInfo?.originCity,                                    619, 405, 13, 100);
    drawText(pdf, docket?.destinationCity,                                    619, 444, 13, 100);
    drawText(pdf, formatDate(docket?.expectedDelivery),                       936, 425, 10);
    drawText(pdf, docket?.consignor?.consignorName,                           257, 290,  9, 360);
    drawText(pdf, docket?.consignor?.address,                                  88, 322,  9, 500);
    drawText(pdf,
      `${docket?.consignor?.city ?? ""} , ${docket?.consignor?.state ?? ""} - ${docket?.consignor?.pin ?? ""}`,
      88, 355, 8);
    drawText(pdf, docket?.consignee?.consigneeName,                           247, 385,  9, 280);
    drawText(pdf, docket?.consignee?.address,                                  87, 417,  9, 280);
    drawText(pdf,
      `${docket?.consignee?.city ?? ""}, ${docket?.consignee?.state ?? ""} - ${docket?.consignee?.pin ?? ""}`,
      87, 449, 9, 280);
    drawText(pdf, invoice?.packet,                                             95, 510, 18);
    drawText(pdf, `${invoice?.weight ?? ""}kg`,                              445, 521, 15);
    drawText(pdf, invoice?.itemDescription,                                  290, 658, 10);

    let dimYpx = 505;
    dims.forEach((d) => {
      drawText(pdf, `${d.length} x ${d.width} x ${d.height} - ${d.noOfPackets} Pkg`, 149, dimYpx, 10);
      dimYpx += 15;
    });

    if (showSignature) {
      try {
        const sig = await toBase64PNG("/sign.png");
        pdf.addImage(sig, "PNG", mmX(893), mmY(590), mmX(170), mmY(111));
      } catch (e) {
        console.warn("Signature not loaded:", e);
      }
    }

    return pdf;
  };

  // ── Download PDF locally ──
  const handleDownloadPDF = async () => {
    if (!docketData) return;
    setGenerating(true);
    try {
      const pdf = await buildPDF();
      pdf.save(`lorry_receipt_${docketData.docket?.docketNo || "receipt"}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      alert(`PDF generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // ── Upload to MIS (ImgBB) and save URL to DB ──
  const handleUploadToMIS = async () => {
    if (!docketData) return;
    if (!IMGBB_API_KEY) {
      alert("ImgBB API key not set. Add VITE_IMGBB_API_KEY to your .env file.");
      return;
    }

    setUploading(true);
    setMisStatus(null);

    try {
      // 1. Build PDF and get page 1 as a JPEG image via canvas
      const pdf = await buildPDF();

      // Get PDF as data URL, then render page 1 to a canvas at high resolution
      const pdfDataUrl = pdf.output("datauristring");

      // Use the PDF's first page rendered to canvas via an offscreen approach
      // We draw the receipt onto a 1123x794 canvas directly (same as preview)
      const receiptCanvas = document.createElement("canvas");
      receiptCanvas.width  = 1123;
      receiptCanvas.height = 794;
      const ctx = receiptCanvas.getContext("2d");

      // White background prevents black transparency artifacts on JPEG export
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1123, 794);

      // Draw template background
      const bgImg = await new Promise((res, rej) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = LORRY_RECEIPT_TEMPLATE;
      });
      ctx.drawImage(bgImg, 0, 0, 1123, 794);

      // Draw all text fields onto canvas (matching PDF content)
      const { docket, bookingInfo, invoice } = docketData;
      const dims = Array.isArray(docket?.dimensions)
        ? docket.dimensions : docket?.dimensions ? [docket.dimensions] : [];

      ctx.fillStyle = "#000000";

      const drawCanvasText = (text, left, top, fontSize, maxWidth) => {
        if (!text && text !== 0) return;
        ctx.font = `bold ${fontSize}px Arial`;
        if (maxWidth) {
          ctx.fillText(String(text), left, top + fontSize * 0.78, maxWidth);
        } else {
          ctx.fillText(String(text), left, top + fontSize * 0.78);
        }
      };

      drawCanvasText(docket?.docketNo,                                        903, 165, 30);
      drawCanvasText(formatDate(docket?.bookingDate),                         908, 204, 17);
      drawCanvasText(formatDate(docket?.bookingDate),                         510, 234, 10);
      drawCanvasText("O/R",                                                   420, 234, 17);
      drawCanvasText(invoice?.invoiceNo,                                      937, 332, 15);
      drawCanvasText(`${invoice?.grossInvoiceValue ?? ""}/-`,                 933, 491, 17);
      drawCanvasText(bookingInfo?.deliveryMode,                               630, 209, 13);
      drawCanvasText(docket?.consignee?.phone,                                599, 319, 20);
      drawCanvasText(bookingInfo?.originCity,                                 619, 405, 17, 100);
      drawCanvasText(docket?.destinationCity,                                 619, 444, 17, 100);
      drawCanvasText(formatDate(docket?.expectedDelivery),                    936, 425, 13);
      drawCanvasText(docket?.consignor?.consignorName,                        257, 290, 12, 360);
      drawCanvasText(docket?.consignor?.address,                               88, 322, 12, 500);
      drawCanvasText(
        `${docket?.consignor?.city ?? ""} , ${docket?.consignor?.state ?? ""} - ${docket?.consignor?.pin ?? ""}`,
        88, 355, 11);
      drawCanvasText(docket?.consignee?.consigneeName,                        247, 385, 12, 280);
      drawCanvasText(docket?.consignee?.address,                               87, 417, 12, 280);
      drawCanvasText(
        `${docket?.consignee?.city ?? ""}, ${docket?.consignee?.state ?? ""} - ${docket?.consignee?.pin ?? ""}`,
        87, 449, 12, 280);
      drawCanvasText(invoice?.packet,                                          95, 510, 24);
      drawCanvasText(`${invoice?.weight ?? ""}kg`,                           445, 521, 20);
      drawCanvasText(invoice?.itemDescription,                                290, 658, 13);

      let dimY = 505;
      dims.forEach((d) => {
        drawCanvasText(`${d.length} x ${d.width} x ${d.height} - ${d.noOfPackets} Pkg`, 149, dimY, 13);
        dimY += 15;
      });

      if (showSignature) {
        try {
          const sigImg = await new Promise((res, rej) => {
            const i = new Image();
            i.crossOrigin = "anonymous";
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = "/sign.png";
          });
          // Use source-over so PNG transparency blends correctly onto white background
          ctx.globalCompositeOperation = "source-over";
          ctx.drawImage(sigImg, 893, 590, 170, 111);
        } catch (e) { console.warn("Signature not loaded"); }
      }

      // 2. Get base64 from canvas (strip the data:image/jpeg;base64, prefix)
      const imageBase64 = receiptCanvas.toDataURL("image/jpeg", 0.92).split(",")[1];

      // 3. Upload to ImgBB
      const formData = new FormData();
      formData.append("key", IMGBB_API_KEY);
      formData.append("image", imageBase64);
      formData.append("name", `lorry_receipt_${docket?.docketNo || id}`);

      const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });

      const imgbbData = await imgbbRes.json();

      if (!imgbbData.success) {
        throw new Error(imgbbData?.error?.message || "ImgBB upload failed");
      }

      const misImageUrl        = imgbbData.data.url;
      const misImageDeleteHash = imgbbData.data.delete_url;

      // 4. Save URL to DB via docketAPI (auto-attaches auth token)
      const saveRes = await docketAPI.saveMisImage(id, misImageUrl, misImageDeleteHash);

      if (!saveRes.success) {
        throw new Error(saveRes.message || "Failed to save URL to database");
      }

      setMisStatus({ success: true, url: misImageUrl });
      console.log("✅ MIS image uploaded and saved:", misImageUrl);

    } catch (err) {
      console.error("MIS upload error:", err);
      setMisStatus({ success: false, error: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handlePrint = () => window.print();

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
    : docket?.dimensions ? [docket.dimensions] : [];

  const ts = (extra = {}) => ({
    fontFamily: "Arial, sans-serif",
    lineHeight: 1,
    padding: 0,
    margin: 0,
    display: "block",
    ...extra,
  });

  return (
    <>
      {/* Visual preview */}
      <div
        className="relative bg-white overflow-hidden"
        style={{ width: "1123px", height: "794px", margin: "16px auto", boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}
      >
        <img src={LORRY_RECEIPT_TEMPLATE} alt="template" className="absolute inset-0 w-full h-full" style={{ objectFit: "fill" }} />

        <div className="absolute" style={{ top: 165, left: 903 }}><span style={ts({ fontSize: 30, fontWeight: "bold" })}>{docket?.docketNo}</span></div>
        <div className="absolute" style={{ top: 204, left: 908 }}><span style={ts({ fontSize: 17, fontWeight: 600 })}>{formatDate(docket?.bookingDate)}</span></div>
        <div className="absolute" style={{ top: 234, left: 510 }}><span style={ts({ fontSize: 10, fontWeight: 600 })}>{formatDate(docket?.bookingDate)}</span></div>
        <div className="absolute" style={{ top: 234, left: 420 }}><span style={ts({ fontSize: 17, fontWeight: 600 })}>O/R</span></div>
        <div className="absolute" style={{ top: 332, left: 937 }}><span style={ts({ fontSize: 15, fontWeight: 600 })}>{invoice?.invoiceNo}</span></div>
        <div className="absolute" style={{ top: 491, left: 933 }}><span style={ts({ fontSize: 17, fontWeight: 600 })}>{invoice?.grossInvoiceValue}/-</span></div>
        <div className="absolute" style={{ top: 209, left: 630 }}><span style={ts({ fontSize: 13, fontWeight: 600 })}>{bookingInfo?.deliveryMode}</span></div>
        <div className="absolute" style={{ top: 319, left: 599 }}><span style={ts({ fontSize: 20, fontWeight: 600 })}>{docket?.consignee?.phone}</span></div>
        <div className="absolute" style={{ top: 405, left: 619, maxWidth: 100 }}><span style={ts({ fontSize: 17, fontWeight: 600 })}>{bookingInfo?.originCity}</span></div>
        <div className="absolute" style={{ top: 444, left: 619, maxWidth: 100 }}><span style={ts({ fontSize: 17, fontWeight: 600 })}>{docket?.destinationCity}</span></div>
        <div className="absolute" style={{ top: 425, left: 936 }}><span style={ts({ fontSize: 13, fontWeight: 600 })}>{formatDate(docket?.expectedDelivery)}</span></div>
        <div className="absolute" style={{ top: 290, left: 257, maxWidth: 360 }}><div style={ts({ fontSize: 12, fontWeight: 600 })}>{docket?.consignor?.consignorName}</div></div>
        <div className="absolute" style={{ top: 322, left: 88,  maxWidth: 500 }}><div style={ts({ fontSize: 12, fontWeight: 600 })}>{docket?.consignor?.address}</div></div>
        <div className="absolute" style={{ top: 355, left: 88,  maxWidth: 360 }}><div style={ts({ fontSize: 11, fontWeight: 600 })}>{docket?.consignor?.city} , {docket?.consignor?.state} - {docket?.consignor?.pin}</div></div>
        <div className="absolute" style={{ top: 385, left: 247, maxWidth: 280 }}><div style={ts({ fontSize: 12, fontWeight: 600 })}>{docket?.consignee?.consigneeName}</div></div>
        <div className="absolute" style={{ top: 417, left: 87,  maxWidth: 280 }}><div style={ts({ fontSize: 12, fontWeight: 600 })}>{docket?.consignee?.address}</div></div>
        <div className="absolute" style={{ top: 449, left: 87,  maxWidth: 280 }}><div style={ts({ fontSize: 12, fontWeight: 600 })}>{docket?.consignee?.city}, {docket?.consignee?.state} - {docket?.consignee?.pin}</div></div>
        <div className="absolute" style={{ top: 510, left: 95  }}><div style={ts({ fontSize: 24, fontWeight: 600 })}>{invoice?.packet}</div></div>
        <div className="absolute" style={{ top: 521, left: 445 }}><div style={ts({ fontSize: 20, fontWeight: 600 })}>{invoice?.weight}kg</div></div>
        <div className="absolute" style={{ top: 658, left: 290 }}><div style={ts({ fontSize: 13, fontWeight: 600 })}>{invoice?.itemDescription}</div></div>
        {dimensionsArray.length > 0 && (
          <div className="absolute" style={{ top: 505, left: 149 }}>
            <div style={ts({ fontSize: 13, fontWeight: "bold" })}>
              {dimensionsArray.map((dim, i) => (
                <div key={i} style={{ marginBottom: 2 }}>{dim.length} x {dim.width} x {dim.height} - {dim.noOfPackets} Pkg</div>
              ))}
            </div>
          </div>
        )}
        {showSignature && (
          <div className="absolute" style={{ top: 590, left: 893 }}>
            <img src="/sign.png" alt="Signature" style={{ width: 170, height: 111, objectFit: "contain" }} />
          </div>
        )}
      </div>

      {/* MIS upload status banner */}
      {misStatus && (
        <div className={`mx-auto mt-2 mb-0 flex items-center gap-3 px-5 py-3 rounded-lg text-sm font-medium print:hidden ${misStatus.success ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}
          style={{ width: "1123px" }}>
          {misStatus.success ? (
            <>
              <svg className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>MIS uploaded successfully!</span>
              <a href={misStatus.url} target="_blank" rel="noreferrer"
                className="ml-2 underline text-green-700 hover:text-green-900 truncate max-w-xs">{misStatus.url}</a>
            </>
          ) : (
            <>
              <svg className="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              <span>Upload failed: {misStatus.error}</span>
            </>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-center gap-4 my-6 print:hidden">

        {/* Signature toggle */}
        <button
          onClick={() => setShowSignature((p) => !p)}
          className={`font-bold px-6 py-4 rounded-lg shadow-xl flex items-center gap-2 text-lg transition-all hover:scale-105 ${showSignature ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
        >
          {showSignature ? "Remove Signature" : "Add Signature"}
        </button>

        {/* Download PDF */}
        <button
          onClick={handleDownloadPDF}
          disabled={generating || uploading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-lg shadow-xl flex items-center gap-3 text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <><svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Generating...</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg> Download PDF</>
          )}
        </button>

        {/* Upload to MIS */}
        <button
          onClick={handleUploadToMIS}
          disabled={generating || uploading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-lg shadow-xl flex items-center gap-3 text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <><svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Uploading to MIS...</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-9.707a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V17a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd"/></svg> Upload to MIS</>
          )}
        </button>

        {/* Browser Print */}
        <button onClick={handlePrint} className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-4 rounded-lg shadow-xl text-lg transition-all hover:scale-105">
          Browser Print
        </button>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `@media print { @page { size: A4 landscape; margin: 0; } body { margin: 0; } .print\\:hidden { display: none !important; } }` }} />
    </>
  );
}