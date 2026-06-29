import { NextResponse, type NextRequest } from "next/server";

// Keep proxy lightweight and Edge-safe. Tenant enforcement belongs in server-side data access helpers.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
