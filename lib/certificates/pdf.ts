import PDFDocument from "pdfkit";
import type { CertificateDocument } from "@/lib/certificates/content";

export async function renderCertificatePdf(document: CertificateDocument) {
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

    pdf.font("Times-Bold").fontSize(12).text("Republic of the Philippines", { align: "center" });
    pdf.font("Times-Roman").fontSize(11).text(document.municipalityLine, { align: "center" });
    pdf.font("Times-Bold").fontSize(14).text(`Barangay ${document.barangayName}`, { align: "center" });
    pdf.font("Times-Roman").fontSize(10).text(document.officeAddress, { align: "center" });
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

    pdf.end();
  });
}
