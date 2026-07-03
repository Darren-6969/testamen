import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/check-email",
  "/reset-success",
  "/reporter-login",
];

const PUBLIC_FILE_REGEX =
  /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|xml|json|woff|woff2|ttf|eot)$/i;

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isAuthPage = AUTH_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const isAuthenticated = !!(token || refreshToken);

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(
      new URL("/module/dashboard", request.url)
    );
  }

  if (!isAuthPage && !isAuthenticated) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};