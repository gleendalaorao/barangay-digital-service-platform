import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  UnderlineType,
} from "docx";
import type { CertificateDocument } from "@/lib/certificates/content";
import { generateQrBuffer } from "@/lib/certificates/qr";

const IMAGE_FETCH_TIMEOUT_MS = 3_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const VERCEL_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const HEADER_IMAGE_BOUND = 56;

type CertificateImage = {
  data: Buffer;
  type: "png" | "jpg";
  width: number;
  height: number;
};

export async function renderCertificateDocx(document: CertificateDocument) {
  const [qrCode, logo, seal] = await Promise.all([
    generateQrBuffer(document.verificationUrl),
    fetchCertificateImage(document.logoUrl),
    fetchCertificateImage(document.sealUrl),
  ]);
  const images = [logo, seal].filter((image): image is CertificateImage => Boolean(image));
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...(images.length > 0
            ? [
                new Paragraph({
                  children: images.flatMap((image, index) => {
                    const transformation = fitImage(image.width, image.height, HEADER_IMAGE_BOUND);
                    return [
                      ...(index > 0 ? [new TextRun({ text: "   " })] : []),
                      new ImageRun({
                        data: image.data,
                        type: image.type,
                        transformation,
                      }),
                    ];
                  }),
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 120 },
                }),
              ]
            : []),
          ...document.headerLines.map((line, index) => centered(line, index === document.headerLines.length - 1)),
          centered(document.officeAddress),
          spacer(),
          new Paragraph({
            text: document.title.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          right(`Control No.: ${document.controlNumber}`),
          spacer(),
          ...document.body.flatMap((paragraph) => [
            new Paragraph({
              children: [new TextRun(paragraph)],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 240 },
            }),
          ]),
          spacer(),
          new Paragraph(`Purpose: ${document.purpose}`),
          new Paragraph(`Issued Date: ${document.issuedDate}`),
          spacer(),
          new Paragraph({
            children: [
              signatureRun(document.preparedBy),
              new TextRun({ text: "\t\t" }),
              signatureRun(document.approvedBy),
            ],
            tabStops: [{ type: "left", position: 5200 }],
          }),
          new Paragraph({
            children: [new TextRun("Prepared by"), new TextRun({ text: "\t\t" }), new TextRun("Approved by / Barangay Captain")],
            tabStops: [{ type: "left", position: 5200 }],
          }),
          spacer(),
          new Paragraph({
            children: [
              new ImageRun({
                data: qrCode,
                type: "png",
                transformation: {
                  width: 90,
                  height: 90,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          centered("Scan to verify authenticity"),
          centered(document.verificationUrl),
          ...(document.footerNote ? [spacer(), centered(document.footerNote)] : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function centered(text: string, bold = false) {
  return new Paragraph({
    children: [new TextRun({ text, bold })],
    alignment: AlignmentType.CENTER,
  });
}

function right(text: string) {
  return new Paragraph({
    text,
    alignment: AlignmentType.RIGHT,
  });
}

function spacer() {
  return new Paragraph({ text: "" });
}

function signatureRun(text: string) {
  return new TextRun({
    text,
    bold: true,
    underline: {
      type: UnderlineType.SINGLE,
    },
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
    const dimensions = readImageDimensions(data, contentType);
    if (!dimensions) {
      return undefined;
    }

    return {
      data,
      type: contentType === "image/png" ? "png" : "jpg",
      ...dimensions,
    };
  } catch {
    return undefined;
  }
}

function readImageDimensions(data: Buffer, contentType: "image/png" | "image/jpeg") {
  if (contentType === "image/png") {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (data.length < 24 || !data.subarray(0, 8).equals(signature)) {
      return undefined;
    }
    const width = data.readUInt32BE(16);
    const height = data.readUInt32BE(20);
    return width > 0 && height > 0 ? { width, height } : undefined;
  }

  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    return undefined;
  }

  let offset = 2;
  while (offset + 8 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = data[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) {
      continue;
    }
    if (offset + 2 > data.length) {
      return undefined;
    }
    const segmentLength = data.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > data.length) {
      return undefined;
    }
    if (isJpegStartOfFrame(marker) && segmentLength >= 7) {
      const height = data.readUInt16BE(offset + 3);
      const width = data.readUInt16BE(offset + 5);
      return width > 0 && height > 0 ? { width, height } : undefined;
    }
    offset += segmentLength;
  }

  return undefined;
}

function isJpegStartOfFrame(marker: number) {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function fitImage(width: number, height: number, bound: number) {
  const scale = Math.min(bound / width, bound / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
