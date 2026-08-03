import PDFDocument from "pdfkit";
import type { CertificateDocument } from "@/lib/certificates/content";
import { generateQrBuffer } from "@/lib/certificates/qr";

const IMAGE_FETCH_TIMEOUT_MS = 3_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const VERCEL_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

type CertificateImage = {
  data: Buffer;
};

export async function renderCertificatePdf(document: CertificateDocument) {
  const [qrCode, logo, seal] = await Promise.all([
    generateQrBuffer(document.verificationUrl),
    fetchCertificateImage(document.logoUrl),
    fetchCertificateImage(document.sealUrl),
  ]);

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

    const images = [logo, seal].filter((image): image is CertificateImage => Boolean(image));
    if (images.length > 0) {
      const imageSize = 56;
      const gap = 12;
      const totalWidth = images.length * imageSize + (images.length - 1) * gap;
      const startX = (pdf.page.width - totalWidth) / 2;
      let embeddedImageCount = 0;

      images.forEach((image, index) => {
        try {
          pdf.image(image.data, startX + index * (imageSize + gap), pdf.y, {
            fit: [imageSize, imageSize],
            align: "center",
            valign: "center",
          });
          embeddedImageCount += 1;
        } catch {
          // A malformed or unsupported image must never prevent certificate generation.
        }
      });

      if (embeddedImageCount > 0) {
        pdf.y += imageSize + 8;
      }
    }

    document.headerLines.forEach((line, index) => {
      pdf.font(index === document.headerLines.length - 1 ? "Times-Bold" : "Times-Roman");
      pdf.fontSize(index === document.headerLines.length - 1 ? 14 : 11).text(line, { align: "center" });
    });
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

async function fetchCertificateImage(urlValue?: string): Promise<CertificateImage | undefined> {
  try {
    const value = urlValue?.trim();
    if (!value) {
      return undefined;
    }

    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.toLowerCase().endsWith(VERCEL_BLOB_HOST_SUFFIX)) {
      return undefined;
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok || !response.body) {
      return undefined;
    }

    const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "image/png" && contentType !== "image/jpeg") {
      return undefined;
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      return undefined;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;

    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) {
        break;
      }
      size += chunk.byteLength;
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(chunk);
    }

    const data = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
    if (!hasExpectedImageSignature(data, contentType)) {
      return undefined;
    }

    return { data };
  } catch {
    return undefined;
  }
}

function hasExpectedImageSignature(data: Buffer, contentType: "image/png" | "image/jpeg") {
  if (contentType === "image/png") {
    return data.length >= 24 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }

  return data.length >= 4 && data[0] === 0xff && data[1] === 0xd8 && data[data.length - 2] === 0xff && data[data.length - 1] === 0xd9;
}
