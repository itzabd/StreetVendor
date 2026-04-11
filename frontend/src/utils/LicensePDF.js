import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

// ── Color palette ────────────────────────────────────────────
const C = {
  primary:   [26, 107, 60],    // sv-primary green
  dark:      [15,  40, 25],    // deep green
  accent:    [245,158, 11],    // amber
  light:     [240,249,244],    // very light green
  muted:     [100,116,139],    // slate-500
  text:      [30,  41, 59],    // slate-800
  white:     [255,255,255],
  approved:  [16, 185,129],    // emerald-500
  sealbg:    [232,245,239],    // light mint
  linegray:  [226,232,240],    // border colour
  section:   [248,250,252],    // section bg
};

function rgb(arr) { return { r: arr[0], g: arr[1], b: arr[2] }; }
function setFill(doc, c)   { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(doc, c)   { doc.setDrawColor(c[0], c[1], c[2]); }
function setTxt(doc, c)    { doc.setTextColor(c[0], c[1], c[2]); }

// Format date helper
function fmtDate(d) {
  if (!d) return 'Ongoing';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
}

// Short UUID (first 8 chars uppercased)
function shortId(id) {
  if (!id) return 'N/A';
  return id.replace(/-/g, '').substring(0, 12).toUpperCase();
}

export async function generateLicensePDF(data) {
  const {
    vendorName    = 'N/A',
    nidNumber     = 'N/A',
    phone         = 'N/A',
    address       = 'N/A',
    permissionType= 'Vending License',
    businessType  = 'Street Vending',
    zoneName      = 'N/A',
    spotNumber    = 'N/A',
    latitude      = null,
    longitude     = null,
    validFrom     = null,
    validUntil    = null,
    licenseId     = '',
    issuedBy      = 'City Corporation Office',
    designation   = 'Licensing Officer',
    operatingHours= '6:00 AM - 9:00 PM',
  } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const ML = 15, MR = 15, MT = 0;
  const CW = W - ML - MR;  // content width = 180mm

  // ── QR code data URL ─────────────────────────────────────
  const qrText = `${window.location.origin}/verify/${licenseId}`;
  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 200, color: { dark: '#1a1a1a', light: '#ffffff' } });
  } catch (e) { console.error('QR gen failed', e); }

  let y = 0; // current Y cursor

  // ════════════════════════════════════════════════════════
  // HEADER BANNER
  // ════════════════════════════════════════════════════════
  setFill(doc, C.primary);
  doc.rect(0, 0, W, 44, 'F');

  // Left accent stripe
  setFill(doc, C.accent);
  doc.rect(0, 0, 5, 44, 'F');

  // Org name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setTxt(doc, C.accent);
  doc.text('DHAKA CITY CORPORATION - MUNICIPAL LICENSING DIVISION', ML + 8, 12);

  // Title
  doc.setFontSize(22);
  setTxt(doc, C.white);
  doc.text('STREET VENDOR LICENSE', ML + 8, 25);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setTxt(doc, [200, 230, 215]);
  doc.text('Official Permit for Authorized Street Vending Operations', ML + 8, 32);

  // QR code (top right)
  if (qrDataUrl) {
    const qrSize = 32;
    doc.addImage(qrDataUrl, 'PNG', W - MR - qrSize - 4, 6, qrSize, qrSize);
  }

  y = 50;

  // ════════════════════════════════════════════════════════
  // LICENSE INFO ROW  (4 boxes)
  // ════════════════════════════════════════════════════════
  const boxes = [
    { label: 'LICENSE ID',    value: shortId(licenseId) },
    { label: 'ISSUE DATE',    value: fmtDate(validFrom || new Date().toISOString()) },
    { label: 'EXPIRY DATE',   value: fmtDate(validUntil) },
    { label: 'STATUS',        value: 'ACTIVE' },
  ];
  const bw = CW / 4;
  boxes.forEach((b, i) => {
    const bx = ML + i * bw;
    setFill(doc, i % 2 === 0 ? C.light : C.white);
    setDraw(doc, C.linegray);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, y, bw - 1, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setTxt(doc, C.muted);
    doc.text(b.label, bx + 3, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(b.label === 'STATUS' ? 8 : 8.5);
    setTxt(doc, b.label === 'STATUS' ? C.approved : C.primary);
    doc.text(b.value, bx + 3, y + 12);
  });

  y += 22;

  const fileName = `${vendorName.replace(/\s+/g, '_')}_License.pdf`;
  
  // ── Helper: Draw section header (replaces sectionHeader emoji version) ──
  function drawSectionHeader(title, yPos) {
    setFill(doc, C.primary);
    doc.rect(ML, yPos, 3, 7, 'F');
    setFill(doc, [236, 253, 245]);
    doc.roundedRect(ML + 4, yPos, CW - 4, 7, 1, 1, 'F');
    
    // Draw a small bullet/icon shape instead of emoji
    setFill(doc, C.primary);
    doc.circle(ML + 7.5, yPos + 3.5, 0.8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setTxt(doc, C.dark);
    doc.text(title, ML + 11, yPos + 5);
    return yPos + 10;
  }

  // Helper: field row (label: value)
  function fieldRow(label, value, xLeft, xRight, yPos, colW, halfW) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTxt(doc, C.muted);
    doc.text(label, xLeft, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setTxt(doc, C.text);
    const valStr = String(value || 'N/A');
    doc.text(valStr.length > 35 ? valStr.substring(0, 32) + '...' : valStr, xLeft, yPos + 5);
    return yPos;
  }

  // ════════════════════════════════════════════════════════
  // VENDOR DETAILS
  // ════════════════════════════════════════════════════════
  y = drawSectionHeader('VENDOR DETAILS', y);

  const col1 = ML + 2, col2 = ML + CW / 2 + 2;
  const halfW = CW / 2 - 4;

  // Add Vendor Photo if available
  if (data.avatar_url) {
    try {
      // We assume it's a valid URL/dataURL. For remote URLs, jsPDF might need them as base64.
      // If it's a remote URL, jsPDF might fail synchronously, so we try-catch.
      doc.addImage(data.avatar_url, 'JPEG', W - MR - 25, y - 5, 20, 20);
      doc.setDrawColor(200, 200, 200);
      doc.rect(W - MR - 25, y - 5, 20, 20, 'S');
    } catch (e) { console.error('Photo add failed', e); }
  }

  // Row 1
  fieldRow('Full Name', vendorName,  col1, col2, y, halfW, halfW);
  fieldRow('NID Number', nidNumber, col2, 0,     y, halfW, halfW);
  y += 11;

  // Row 2
  fieldRow('Phone Number', phone,   col1, col2, y, halfW, halfW);
  fieldRow('Residence Address', address, col2, 0, y, halfW, halfW);
  y += 11;

  // Divider
  setDraw(doc, C.linegray);
  doc.setLineWidth(0.3);
  doc.line(ML, y, W - MR, y);
  y += 3;

  // ════════════════════════════════════════════════════════
  // BUSINESS & PERMISSION DETAILS
  // ════════════════════════════════════════════════════════
  y = drawSectionHeader('BUSINESS & PERMISSION DETAILS', y);

  fieldRow('Business / Stall Name', data.businessName || businessType, col1, col2, y, halfW, halfW);
  fieldRow('Business Category', data.businessType || 'General Vending', col2, 0,    y, halfW, halfW);
  y += 11;

  fieldRow('Approved Vending Zone', zoneName,  col1, col2, y, halfW, halfW);
  fieldRow('Operating Hours', operatingHours,  col2, 0,    y, halfW, halfW);
  y += 11;

  setDraw(doc, C.linegray);
  doc.line(ML, y, W - MR, y);
  y += 3;

  // ════════════════════════════════════════════════════════
  // LOCATION DETAILS
  // ════════════════════════════════════════════════════════
  y = drawSectionHeader('APPROVED LOCATION DETAILS', y);

  const gps = latitude && longitude
    ? `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`
    : 'Not recorded';

  const col3 = ML + 2, col4 = ML + CW / 3 + 2, col5 = ML + (2 * CW) / 3 + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setTxt(doc, C.muted);
  doc.text('Spot Number', col3, y);
  doc.text('GPS Coordinates', col4, y);
  doc.text('Nearby Zone / Area', col5, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  setTxt(doc, C.text);
  doc.text(spotNumber || 'N/A', col3, y + 5);
  doc.text(gps,                 col4, y + 5);
  doc.text(zoneName,            col5, y + 5);
  y += 11;

  setDraw(doc, C.linegray);
  doc.line(ML, y, W - MR, y);
  y += 3;

  // ════════════════════════════════════════════════════════
  // DOCUMENT VERIFICATION
  // ════════════════════════════════════════════════════════
  y = drawSectionHeader('DOCUMENT VERIFICATION', y);

  const checks = [
    'National Identity (NID) – Verified',
    'Residence Address – Verified',
    `Supporting Documents (TIN: ${data.tinNumber || 'N/A'}) – Verified & Filed`,
  ];
  checks.forEach((chk, i) => {
    setFill(doc, C.approved);
    doc.circle(ML + 4, y + 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setTxt(doc, C.white);
    doc.text('V', ML + 3.2, y + 3.5); // Using V instead of checkmark symbol for better compatibility

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setTxt(doc, C.text);
    doc.text(chk, ML + 9, y + 3.5);
    y += 7;
  });
  y += 2;

  setDraw(doc, C.linegray);
  doc.line(ML, y, W - MR, y);
  y += 3;

  // ════════════════════════════════════════════════════════
  // TERMS & CONDITIONS
  // ════════════════════════════════════════════════════════
  y = drawSectionHeader('TERMS & CONDITIONS', y);

  const terms = [
    '1.  The vendor must operate strictly within the approved vending area specified above.',
    '2.  The vendor must not obstruct roads, public pathways, or emergency access routes.',
    '3.  This license must be physically displayed or digitally presented during all operating hours.',
    '4.  Any violation may result in immediate suspension or permanent cancellation of this license.',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTxt(doc, C.text);
  terms.forEach(t => {
    doc.text(t, ML + 3, y);
    y += 5.5;
  });
  y += 1;

  setDraw(doc, C.linegray);
  doc.line(ML, y, W - MR, y);
  y += 3;

  // ════════════════════════════════════════════════════════
  // AUTHORIZATION
  // ════════════════════════════════════════════════════════
  y = drawSectionHeader('AUTHORIZATION', y);

  // Left column: officer info
  const authColW = CW / 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setTxt(doc, C.muted);
  doc.text('Approved By', ML + 2, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setTxt(doc, C.dark);
  doc.text(issuedBy, ML + 2, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTxt(doc, C.muted);
  doc.text(designation, ML + 2, y + 12);

  // Signature line
  setDraw(doc, C.linegray);
  doc.setLineWidth(0.4);
  doc.line(ML + 2, y + 20, ML + 2 + authColW - 4, y + 20);
  doc.setFontSize(7);
  setTxt(doc, C.muted);
  doc.text('Authorized Signature', ML + 2, y + 25);

  // (Seal and QR moved to top header)

  y += 32;

  // ════════════════════════════════════════════════════════
  // FOOTER
  // ════════════════════════════════════════════════════════
  // Bottom accent strip
  setFill(doc, C.primary);
  doc.rect(0, H - 18, W, 18, 'F');
  setFill(doc, C.accent);
  doc.rect(0, H - 18, 5, 18, 'F');

  // Footer text
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  setTxt(doc, [200, 230, 215]);
  doc.text(
    'This is a digitally generated license and is legally valid without a physical signature.',
    ML + 8, H - 10
  );
  doc.setFont('helvetica', 'normal');
  setTxt(doc, C.accent);
  doc.text(
    'Dhaka City Corporation  |  Gulshan-1, Dhaka-1212  |  licensing@dcc.gov.bd',
    ML + 8, H - 5
  );

  // Page border
  setDraw(doc, C.linegray);
  doc.setLineWidth(0.5);
  doc.rect(3, 3, W - 6, H - 6);

  // Save
  doc.save(fileName);
}
