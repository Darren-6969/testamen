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

function decodeTokenPayload(token?: string) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    return JSON.parse(decoded) as {
      portal?: string;
      statusId?: number | string;
      status_id?: number | string;
    };
  } catch {
    return null;
  }
}

function isAdminToken(token?: string) {
  const payload = decodeTokenPayload(token);
  const statusId = Number(payload?.statusId ?? payload?.status_id);

  return payload?.portal === "admin" || statusId === 1;
}

function hasUsableAuthCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("access_token")?.value ||
      request.cookies.get("token")?.value ||
      request.cookies.get("auth_token")?.value ||
      request.cookies.get("refreshToken")?.value ||
      request.cookies.get("refresh_token")?.value
  );
}

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get("access_token")?.value ||
    request.cookies.get("token")?.value ||
    request.cookies.get("auth_token")?.value;
  const refreshToken =
    request.cookies.get("refreshToken")?.value ||
    request.cookies.get("refresh_token")?.value;

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

  const isAuthenticated =
    isAdminToken(token) || isAdminToken(refreshToken) || hasUsableAuthCookie(request);

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
