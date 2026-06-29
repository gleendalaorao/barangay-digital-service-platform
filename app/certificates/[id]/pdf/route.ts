import { NextResponse } from "next/server";
import { buildCertificateDocument, canExportCertificate } from "@/lib/certificates/content";
import { renderCertificatePdf } from "@/lib/certificates/pdf";
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
  const pdf = await renderCertificatePdf(document);
  const fileName = `${document.controlNumber || "certificate"}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
