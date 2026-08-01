import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRequestIp, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith("/callback/credentials")) {
    const rateLimit = await checkRateLimit({
      ...RATE_LIMITS.staffLogin,
      identifier: getRequestIp(request.headers),
    });

    if (!rateLimit.allowed) {
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set("error", "RateLimited");
      errorUrl.searchParams.set("code", String(rateLimit.retryAfterSeconds));

      return NextResponse.json(
        { url: errorUrl.toString() },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }
  }

  return handlers.POST(request);
}
