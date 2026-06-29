import PDFDocument from "pdfkit";
import type { CertificateDocument } from "@/lib/certificates/content";
import { generateQrBuffer } from "@/lib/certificates/qr";

export async function renderCertificatePdf(document: CertificateDocument) {
  const qrCode = await generateQrBuffer(document.verificationUrl);

  return new Promise<Buffer>((resolve, reject) => {
    const pdf = new PDFDocument({
      size: "A4",
      margin: 72,
      info: {
        Title: document.title,
        Author: document.barangayName,
      },
    });
    const chunks: Buffer[] = [];

    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    document.headerLines.forEach((line, index) => {
      pdf.font(index === document.headerLines.length - 1 ? "Times-Bold" : "Times-Roman");
      pdf.fontSize(index === document.headerLines.length - 1 ? 14 : 11).text(line, { align: "center" });
    });
    pdf.font("Times-Roman").fontSize(10).text(document.officeAddress, { align: "center" });
    if (document.logoUrl || document.sealUrl) {
      pdf.moveDown();
      pdf.fontSize(8).text(`Logo/Seal: ${[document.logoUrl, document.sealUrl].filter(Boolean).join(" | ")}`, {
        align: "center",
      });
    }
    pdf.moveDown(2);

    pdf.font("Times-Bold").fontSize(18).text(document.title.toUpperCase(), { align: "center" });
    pdf.moveDown();
    pdf.font("Times-Roman").fontSize(10).text(`Control No.: ${document.controlNumber}`, { align: "right" });
    pdf.moveDown(2);

    pdf.font("Times-Roman").fontSize(12);
    for (const paragraph of document.body) {
      pdf.text(paragraph, {
        align: "justify",
        lineGap: 5,
      });
      pdf.moveDown();
    }

    pdf.moveDown(2);
    pdf.text(`Purpose: ${document.purpose}`);
    pdf.text(`Issued Date: ${document.issuedDate}`);
    pdf.moveDown(3);

    const signatureY = pdf.y;
    pdf.font("Times-Bold").fontSize(11).text(document.preparedBy, 72, signatureY, {
      width: 180,
      align: "center",
    });
    pdf.font("Times-Roman").fontSize(10).text("Prepared by", 72, signatureY + 16, {
      width: 180,
      align: "center",
    });
    pdf.font("Times-Bold").fontSize(11).text(document.approvedBy, 330, signatureY, {
      width: 180,
      align: "center",
    });
    pdf.font("Times-Roman").fontSize(10).text("Approved by / Barangay Captain", 330, signatureY + 16, {
      width: 180,
      align: "center",
    });
    pdf.moveDown(4);

    const qrY = pdf.y;
    pdf.image(qrCode, 246, qrY, { width: 90, height: 90 });
    pdf.font("Times-Roman").fontSize(8).text("Scan to verify authenticity", 72, qrY + 96, {
      width: 468,
      align: "center",
    });
    pdf.fontSize(7).text(document.verificationUrl, 72, qrY + 108, {
      width: 468,
      align: "center",
    });

    if (document.footerNote) {
      pdf.y = qrY + 126;
      pdf.font("Times-Roman").fontSize(9).text(document.footerNote, { align: "center" });
    }

    pdf.end();
  });
}
