// scripts/generateLorryReceiptPDF.js
// Node.js PDF generator using puppeteer - replaces Python/reportlab entirely
// Install: npm install puppeteer

import puppeteer from 'puppeteer';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function buildHTML(docketData, templateBase64, signatureBase64, showSignature) {
  const { docket, bookingInfo, invoice } = docketData;

  const dimensionsArray = Array.isArray(docket?.dimensions)
    ? docket.dimensions
    : docket?.dimensions ? [docket.dimensions] : [];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1123px; height: 794px; overflow: hidden; background: white; }
    .page { position: relative; width: 1123px; height: 794px; }
    .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; }
    .field {
      position: absolute;
      font-family: Arial, sans-serif;
      font-weight: bold;
      line-height: 1;
      white-space: nowrap;
    }
    .wrap { white-space: normal; }
  </style>
</head>
<body>
<div class="page">

  <img class="bg" src="${templateBase64}" />

  <!-- CONSIGNMENT NOTE NUMBER -->
  <span class="field" style="top:165px;left:903px;font-size:30px;">${docket?.docketNo ?? ''}</span>

  <!-- DATE top-right -->
  <span class="field" style="top:204px;left:908px;font-size:17px;">${formatDate(docket?.bookingDate)}</span>

  <!-- DATE mid small -->
  <span class="field" style="top:234px;left:510px;font-size:10px;">${formatDate(docket?.bookingDate)}</span>

  <!-- O/R -->
  <span class="field" style="top:234px;left:420px;font-size:17px;">O/R</span>

  <!-- INVOICE No -->
  <span class="field" style="top:332px;left:937px;font-size:15px;">${invoice?.invoiceNo ?? ''}</span>

  <!-- VALUE -->
  <span class="field" style="top:491px;left:933px;font-size:17px;">${invoice?.grossInvoiceValue ?? ''}/-</span>

  <!-- DELIVERY MODE -->
  <span class="field" style="top:209px;left:630px;font-size:13px;">${bookingInfo?.deliveryMode ?? ''}</span>

  <!-- CONSIGNEE PHONE -->
  <span class="field" style="top:319px;left:599px;font-size:20px;">${docket?.consignee?.phone ?? ''}</span>

  <!-- FROM -->
  <span class="field" style="top:405px;left:619px;font-size:17px;max-width:100px;">${bookingInfo?.originCity ?? ''}</span>

  <!-- TO -->
  <span class="field" style="top:444px;left:619px;font-size:17px;max-width:100px;">${docket?.destinationCity ?? ''}</span>

  <!-- DATE OF DELIVERY -->
  <span class="field" style="top:425px;left:936px;font-size:13px;">${formatDate(docket?.expectedDelivery)}</span>

  <!-- CONSIGNOR NAME -->
  <span class="field" style="top:290px;left:257px;font-size:12px;max-width:360px;">${docket?.consignor?.consignorName ?? ''}</span>

  <!-- CONSIGNOR ADDRESS -->
  <span class="field wrap" style="top:322px;left:88px;font-size:12px;max-width:500px;">${docket?.consignor?.address ?? ''}</span>

  <!-- CONSIGNOR CITY/STATE/PIN -->
  <span class="field" style="top:355px;left:88px;font-size:11px;max-width:360px;">${docket?.consignor?.city ?? ''}, ${docket?.consignor?.state ?? ''} - ${docket?.consignor?.pin ?? ''}</span>

  <!-- CONSIGNEE NAME -->
  <span class="field" style="top:385px;left:247px;font-size:12px;max-width:280px;">${docket?.consignee?.consigneeName ?? ''}</span>

  <!-- CONSIGNEE ADDRESS -->
  <span class="field wrap" style="top:417px;left:87px;font-size:12px;max-width:280px;">${docket?.consignee?.address ?? ''}</span>

  <!-- CONSIGNEE CITY/STATE/PIN -->
  <span class="field" style="top:449px;left:87px;font-size:12px;max-width:280px;">${docket?.consignee?.city ?? ''}, ${docket?.consignee?.state ?? ''} - ${docket?.consignee?.pin ?? ''}</span>

  <!-- PACKETS -->
  <span class="field" style="top:510px;left:95px;font-size:24px;">${invoice?.packet ?? ''}</span>

  <!-- ITEM DESCRIPTION -->
  <span class="field" style="top:658px;left:290px;font-size:13px;">${invoice?.itemDescription ?? ''}</span>

  <!-- WEIGHT -->
  <span class="field" style="top:521px;left:445px;font-size:20px;">${invoice?.weight ?? ''}kg</span>

  <!-- DIMENSIONS -->
  ${dimensionsArray.length > 0 ? `
  <div class="field" style="top:505px;left:149px;font-size:13px;line-height:1.4;">
    ${dimensionsArray.map(dim =>
      `<div>${dim.length} x ${dim.width} x ${dim.height} - ${dim.noOfPackets} Pkg</div>`
    ).join('')}
  </div>` : ''}

  <!-- SIGNATURE -->
  ${showSignature && signatureBase64 ? `
  <img src="${signatureBase64}" style="position:absolute;top:590px;left:893px;width:170px;height:111px;object-fit:contain;" />
  ` : ''}

</div>
</body>
</html>`;
}

export async function generatePDF(docketData, templatePath, outputPath, signaturePath, showSignature) {
  // Load template image as base64
  if (!existsSync(templatePath)) {
    throw new Error('Template not found: ' + templatePath);
  }

  const templateExt = path.extname(templatePath).slice(1).toLowerCase();
  const templateMime = templateExt === 'jpg' ? 'jpeg' : templateExt;
  const templateBase64 = `data:image/${templateMime};base64,${readFileSync(templatePath).toString('base64')}`;

  // Load signature as base64 if needed
  let signatureBase64 = null;
  if (showSignature && signaturePath && existsSync(signaturePath)) {
    const sigExt = path.extname(signaturePath).slice(1).toLowerCase();
    const sigMime = sigExt === 'jpg' ? 'jpeg' : sigExt;
    signatureBase64 = `data:image/${sigMime};base64,${readFileSync(signaturePath).toString('base64')}`;
  }

  const html = buildHTML(docketData, templateBase64, signatureBase64, showSignature);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set exact A4 landscape viewport
    await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: outputPath,
      width: '297mm',
      height: '210mm',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    console.log('PDF generated successfully:', outputPath);
  } finally {
    await browser.close();
  }
}

// CLI entrypoint: node generateLorryReceiptPDF.js data.json template.png out.pdf sign.png true
if (process.argv[2]) {
  const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const template = process.argv[3];
  const output = process.argv[4];
  const signature = process.argv[5] || null;
  const showSig = process.argv[6] === 'true';

  generatePDF(data, template, output, signature, showSig)
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}