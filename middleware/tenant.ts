import type { NextRequest } from "next/server";

export function getRequestOrigin(request: NextRequest) {
  return request.headers.get("origin") ?? request.nextUrl.origin;
}
