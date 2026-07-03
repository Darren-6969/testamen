// middleware.ts
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
 
const PUBLIC_FILE_REGEX = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|xml|json|woff|woff2|ttf|eot)$/i;
 
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;
 
  // Allow public/static files such as /Logo.png
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }
 
  const isAuthPage =
    pathname === "/" ||
    AUTH_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
 
  const isAuthenticated = !!(token || refreshToken);
 
  // Authenticated user trying to access login/register — send to dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/module/dashboard", request.url));
  }
 
  // Unauthenticated user on a protected route — send to login
  if (!isAuthPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
 
  return NextResponse.next();
}
 
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|xml|json|woff|woff2|ttf|eot)$).*)",
  ],
};