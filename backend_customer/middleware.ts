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

const CUSTOMER_PAGE_PREFIXES = [
  "/module/dashboard",
  "/module/customer-profile",
  "/module/billing",
  "/module/obituary",
  "/module/love-giving",
  "/module/memorials",
  "/module/admin",
  "/invoice",
];

const CUSTOMER_EXACT_PAGES = [
  "/module/setting",
  "/module/setting/change-password",
];

const PUBLIC_FILE_REGEX =
  /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|xml|json|woff|woff2|ttf|eot)$/i;

function decodeTokenPayload(token?: string) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    return JSON.parse(decoded) as { portal?: string; statusId?: number };
  } catch {
    return null;
  }
}

function isCustomerToken(token?: string) {
  const payload = decodeTokenPayload(token);
  return payload?.portal === "customer" || payload?.statusId === 2;
}

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

  const isAuthenticated = isCustomerToken(token) || isCustomerToken(refreshToken);

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/module/dashboard" : "/login", request.url)
    );
  }

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

  const isCustomerPage =
    CUSTOMER_EXACT_PAGES.includes(pathname) ||
    CUSTOMER_PAGE_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );

  if (isAuthenticated && !isAuthPage && !isCustomerPage) {
    return NextResponse.redirect(
      new URL("/module/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
