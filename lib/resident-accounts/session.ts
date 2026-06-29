import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const RESIDENT_SESSION_COOKIE = "resident_account_session";

function getSessionSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "development-resident-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeSession(accountId: string) {
  return `${accountId}.${sign(accountId)}`;
}

function decodeSession(value?: string) {
  if (!value) {
    return null;
  }

  const [accountId, signature] = value.split(".");

  if (!accountId || !signature) {
    return null;
  }

  const expected = sign(accountId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  return accountId;
}

export async function setResidentSession(accountId: string) {
  const cookieStore = await cookies();

  cookieStore.set(RESIDENT_SESSION_COOKIE, encodeSession(accountId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearResidentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(RESIDENT_SESSION_COOKIE);
}

export async function getResidentSession(barangaySlug: string) {
  const cookieStore = await cookies();
  const accountId = decodeSession(cookieStore.get(RESIDENT_SESSION_COOKIE)?.value);

  if (!accountId) {
    return null;
  }

  return prisma.residentAccount.findFirst({
    where: {
      id: accountId,
      barangay: {
        slug: barangaySlug,
      },
    },
    include: {
      barangay: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      resident: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
        },
      },
      verificationRequests: {
        orderBy: { submittedAt: "desc" },
        take: 5,
      },
    },
  });
}
