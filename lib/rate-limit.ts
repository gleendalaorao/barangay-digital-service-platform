import "server-only";

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

type RateLimitInput = {
  action: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export const RATE_LIMITS = {
  staffLogin: { action: "STAFF_LOGIN", limit: 5, windowMs: 15 * 60 * 1000 },
  residentLogin: { action: "RESIDENT_LOGIN", limit: 5, windowMs: 15 * 60 * 1000 },
  residentSignup: { action: "RESIDENT_SIGNUP", limit: 3, windowMs: 60 * 60 * 1000 },
  publicRequest: { action: "PUBLIC_REQUEST_CREATE", limit: 5, windowMs: 60 * 60 * 1000 },
  trackingByIp: { action: "PUBLIC_REQUEST_TRACK_IP", limit: 10, windowMs: 15 * 60 * 1000 },
  trackingByCode: { action: "PUBLIC_REQUEST_TRACK_CODE", limit: 5, windowMs: 15 * 60 * 1000 },
  certificateVerification: { action: "CERTIFICATE_VERIFY", limit: 60, windowMs: 15 * 60 * 1000 },
} as const;

export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const now = new Date();
  const windowStartMs = Math.floor(now.getTime() / input.windowMs) * input.windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + input.windowMs);
  const keyHash = hashIdentifier(input.action, input.identifier);

  await prisma.rateLimitBucket.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  const bucket = await prisma.rateLimitBucket.upsert({
    where: {
      action_keyHash_windowStart: {
        action: input.action,
        keyHash,
        windowStart,
      },
    },
    update: {
      count: {
        increment: 1,
      },
      expiresAt,
    },
    create: {
      action: input.action,
      keyHash,
      windowStart,
      count: 1,
      expiresAt,
    },
    select: {
      count: true,
    },
  });

  const allowed = bucket.count <= input.limit;

  return {
    allowed,
    limit: input.limit,
    remaining: Math.max(0, input.limit - bucket.count),
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export function getRequestIp(headers: Pick<Headers, "get">) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || headers.get("x-real-ip")?.trim() || "unknown";
}

export function formatRateLimitMessage(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

function hashIdentifier(action: string, identifier: string) {
  return createHash("sha256")
    .update(`${action}:${identifier.trim().toLowerCase()}`)
    .digest("hex");
}
