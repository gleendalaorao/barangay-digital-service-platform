import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  UnderlineType,
} from "docx";
import type { CertificateDocument } from "@/lib/certificates/content";

export async function renderCertificateDocx(document: CertificateDocument) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...document.headerLines.map((line, index) => centered(line, index === document.headerLines.length - 1)),
          centered(document.officeAddress),
          ...(document.logoUrl || document.sealUrl
            ? [centered(`Logo/Seal: ${[document.logoUrl, document.sealUrl].filter(Boolean).join(" | ")}`)]
            : []),
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
