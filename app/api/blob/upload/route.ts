import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { canManageAnnouncements, requireAnnouncementSession } from "@/lib/announcements/access";
import {
  blobUploadPolicies,
  parseBlobUploadClientPayload,
  validateBlobTokenPathname,
} from "@/lib/blob/upload-policy";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await requireAnnouncementSession();

        if (!canManageAnnouncements(session.role)) {
          throw new Error("Only admins and secretaries can upload website content.");
        }

        const target = parseBlobUploadClientPayload(clientPayload);
        validateBlobTokenPathname(pathname, session.barangayId, target);
        const policy = blobUploadPolicies[target.kind];

        return {
          allowedContentTypes: [...policy.allowedContentTypes],
          maximumSizeInBytes: policy.maximumSizeInBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            barangayId: session.barangayId,
            userId: session.userId,
            kind: target.kind,
            folder: target.folder,
          }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to authorize upload." },
      { status: 400 },
    );
  }
}
