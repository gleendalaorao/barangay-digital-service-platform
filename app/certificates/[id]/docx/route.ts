import { NextResponse } from "next/server";
import { buildCertificateDocument, canExportCertificate } from "@/lib/certificates/content";
import { renderCertificateDocx } from "@/lib/certificates/docx";
import { getCertificateForRender } from "@/lib/certificates/query";
import { getCertificateVerificationUrl } from "@/lib/certificates/qr";
import { requireCertificateSession } from "@/lib/certificates/access";

export const runtime = "nodejs";

type ExportRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: ExportRouteProps) {
  const { id } = await params;
  const session = await requireCertificateSession();
  const certificate = await getCertificateForRender(id, session.barangayId);

  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  if (!canExportCertificate(certificate.status)) {
    return NextResponse.json({ error: "Only approved or released certificates can be exported." }, { status: 403 });
  }

  const document = buildCertificateDocument(certificate, getCertificateVerificationUrl(certificate.id));
  const docx = await renderCertificateDocx(document);
  const fileName = `${document.controlNumber || "certificate"}.docx`;

  return new NextResponse(new Uint8Array(docx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
