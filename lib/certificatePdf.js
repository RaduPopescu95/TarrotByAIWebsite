import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const DEFAULT_ISSUER_NAME = "Cristina Zurba";
const FONT_REGULAR_PATH = path.join(process.cwd(), "public", "fonts", "Poppins-Regular.ttf");
const FONT_SEMIBOLD_PATH = path.join(process.cwd(), "public", "fonts", "Poppins-SemiBold.ttf");
const FONT_TITLE_PATH = path.join(process.cwd(), "public", "fonts", "Lora", "Lora-Bold.ttf");
const LOGO_PATH = path.join(process.cwd(), "public", "LogoPngTransparent.png");

function registerFonts(doc) {
  const fontNames = {
    regular: "Helvetica",
    semibold: "Helvetica-Bold",
    title: "Times-Bold",
  };

  try {
    if (fs.existsSync(FONT_REGULAR_PATH)) {
      doc.registerFont("CertificateRegular", FONT_REGULAR_PATH);
      fontNames.regular = "CertificateRegular";
    }
  } catch (_) {}

  try {
    if (fs.existsSync(FONT_SEMIBOLD_PATH)) {
      doc.registerFont("CertificateSemibold", FONT_SEMIBOLD_PATH);
      fontNames.semibold = "CertificateSemibold";
    }
  } catch (_) {}

  try {
    if (fs.existsSync(FONT_TITLE_PATH)) {
      doc.registerFont("CertificateTitle", FONT_TITLE_PATH);
      fontNames.title = "CertificateTitle";
    }
  } catch (_) {}

  return fontNames;
}

function drawDecorativeFrame(doc) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.save();
  doc.rect(0, 0, pageWidth, pageHeight).fill("#f7f1e6");

  doc.lineWidth(2.5);
  doc.strokeColor("#c9a96a");
  doc.roundedRect(22, 22, pageWidth - 44, pageHeight - 44, 10).stroke();

  doc.lineWidth(1);
  doc.strokeColor("#d9c8a1");
  doc.roundedRect(34, 34, pageWidth - 68, pageHeight - 68, 8).stroke();

  doc.fillColor("#e8dcc5").opacity(0.45);
  doc.circle(72, 72, 48).fill();
  doc.circle(pageWidth - 72, pageHeight - 72, 48).fill();
  doc.opacity(1);
  doc.restore();
}

function drawLogo(doc) {
  try {
    if (!fs.existsSync(LOGO_PATH)) return;
    const logoWidth = 170;
    const x = (doc.page.width - logoWidth) / 2;
    doc.image(LOGO_PATH, x, 52, {
      fit: [logoWidth, 64],
      align: "center",
      valign: "center",
    });
  } catch (_) {
    // Logo is optional for rendering resilience.
  }
}

function formatIssuedDate(issuedAt, localeCode) {
  const date = issuedAt instanceof Date ? issuedAt : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeCode === "ro" ? "ro-RO" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export async function buildCourseCertificatePdf({
  localeCode,
  copy,
  recipientName,
  courseTitle,
  issuedAt,
  certificateId,
  issuerName = DEFAULT_ISSUER_NAME,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 44, right: 52, bottom: 44, left: 52 },
      info: {
        Title: `${copy?.title || "Certificate"} - ${courseTitle || "Course"}`,
        Author: issuerName,
        Subject: "Course certificate",
      },
    });

    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const fonts = registerFonts(doc);
    drawDecorativeFrame(doc);
    drawLogo(doc);

    const contentX = doc.page.margins.left;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fillColor("#1f2937");
    doc.font(fonts.title).fontSize(43).text(copy.title, contentX, 136, {
      width: contentWidth,
      align: "center",
    });

    doc.fillColor("#6b7280");
    doc.font(fonts.regular).fontSize(15).text(copy.subtitle, contentX, 186, {
      width: contentWidth,
      align: "center",
    });

    doc.fillColor("#4b5563");
    doc.font(fonts.regular).fontSize(16).text(copy.awardedTo, contentX, 236, {
      width: contentWidth,
      align: "center",
    });

    doc.fillColor("#af7a1a");
    doc.font(fonts.semibold).fontSize(38).text(recipientName, contentX, 266, {
      width: contentWidth,
      align: "center",
    });

    const lineY = 322;
    const lineWidth = Math.min(420, contentWidth - 120);
    const lineX = (doc.page.width - lineWidth) / 2;
    doc.moveTo(lineX, lineY).lineTo(lineX + lineWidth, lineY).lineWidth(1.5).strokeColor("#c9a96a").stroke();

    doc.fillColor("#4b5563");
    doc.font(fonts.regular).fontSize(15).text(copy.forCourse, contentX, 338, {
      width: contentWidth,
      align: "center",
    });

    doc.fillColor("#111827");
    doc.font(fonts.semibold).fontSize(24).text(courseTitle, contentX, 362, {
      width: contentWidth,
      align: "center",
      lineGap: 4,
    });

    const issuedLabel = `${copy.issuedOn}: ${formatIssuedDate(issuedAt, localeCode)}`;
    const issuerLabel = `${copy.issuer}: ${issuerName}`;
    const certificateIdLabel = `${copy.certificateId}: ${certificateId}`;

    doc.fillColor("#4b5563");
    doc.font(fonts.regular).fontSize(12).text(issuedLabel, contentX, 500, {
      width: contentWidth / 3,
      align: "left",
    });

    doc.font(fonts.regular).fontSize(12).text(issuerLabel, contentX + contentWidth / 3, 500, {
      width: contentWidth / 3,
      align: "center",
    });

    doc.font(fonts.regular).fontSize(12).text(certificateIdLabel, contentX + (contentWidth / 3) * 2, 500, {
      width: contentWidth / 3,
      align: "right",
    });

    doc.end();
  });
}
