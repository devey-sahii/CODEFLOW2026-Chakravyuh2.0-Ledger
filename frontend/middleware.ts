import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/verify-otp"];
const AUTH_REDIRECT = "/login";
const DASHBOARD_REDIRECT = "/dashboard";

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isDashboardPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Get token from cookies (preferred) or Authorization header
  const token =
    request.cookies.get("access_token")?.value ||
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const isAuthenticated = Boolean(token);

  // Protect dashboard routes: redirect to login if not authenticated
  if (isDashboardPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL(AUTH_REDIRECT, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isPublicPath(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL(DASHBOARD_REDIRECT, request.url));
  }

  // Redirect root to dashboard if authenticated, else to login
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(DASHBOARD_REDIRECT, request.url));
    } else {
      return NextResponse.redirect(new URL(AUTH_REDIRECT, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
