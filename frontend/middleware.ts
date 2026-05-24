import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/verify-otp"];
const AUTH_REDIRECT = "/login";
const ROLE_SELECT_REDIRECT = "/select-role";
const DASHBOARD_REDIRECT = "/dashboard";

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isDashboardPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
}

function isRoleSelectPath(pathname: string): boolean {
  return pathname.startsWith("/select-role");
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

  // Get auth token from cookies
  const token =
    request.cookies.get("access_token")?.value ||
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const isAuthenticated = Boolean(token);

  // Get role selection cookie (set when user picks a role on /select-role)
  const selectedRole = request.cookies.get("selected_role")?.value;
  const hasSelectedRole = Boolean(selectedRole);

  // ── Not authenticated: protect private routes ──────────────────────────────
  if (!isAuthenticated) {
    // Allow public auth pages
    if (isPublicPath(pathname)) return NextResponse.next();

    // Block select-role and dashboard — redirect to login
    if (isDashboardPath(pathname) || isRoleSelectPath(pathname)) {
      const loginUrl = new URL(AUTH_REDIRECT, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── Authenticated ──────────────────────────────────────────────────────────

  // Redirect away from login/signup pages if already logged in
  if (isPublicPath(pathname)) {
    // If they haven't selected a role yet, send to role selection
    if (!hasSelectedRole) {
      return NextResponse.redirect(new URL(ROLE_SELECT_REDIRECT, request.url));
    }
    return NextResponse.redirect(new URL(DASHBOARD_REDIRECT, request.url));
  }

  // If authenticated but hasn't selected a role, force /select-role
  // (Unless they're already on /select-role)
  if (isDashboardPath(pathname) && !hasSelectedRole) {
    return NextResponse.redirect(new URL(ROLE_SELECT_REDIRECT, request.url));
  }

  // If they've selected a role and visit /select-role, send to dashboard
  if (isRoleSelectPath(pathname) && hasSelectedRole) {
    return NextResponse.redirect(new URL(DASHBOARD_REDIRECT, request.url));
  }

  // Root redirect for authenticated user
  if (pathname === "/") {
    if (!hasSelectedRole) {
      return NextResponse.redirect(new URL(ROLE_SELECT_REDIRECT, request.url));
    }
    return NextResponse.redirect(new URL(DASHBOARD_REDIRECT, request.url));
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
