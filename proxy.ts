import { NextResponse, type NextRequest } from "next/server";

const protectedPathPrefixes = [
  "/",
  "/platform",
  "/announcements",
  "/audit-logs",
  "/certificates",
  "/households",
  "/reports",
  "/requests",
  "/residents",
  "/resident-verifications",
  "/search",
  "/settings",
  "/users",
  "/website",
];

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value,
  );
}

function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some((prefix) => pathname === prefix || (prefix !== "/" && pathname.startsWith(`${prefix}/`)));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname) && !hasSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|b/|verify/|_next/static|_next/image|favicon.ico).*)"],
};
