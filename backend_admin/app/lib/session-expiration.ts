'use client';

import Cookies from 'js-cookie';
import { toast } from 'sonner';

export const SESSION_EXPIRED_REASON = 'session-expired';
const SESSION_EXPIRY_AT_KEY = 'session_expiry_at';
const SESSION_ACCESS_TOKEN_KEY = 'authToken';
const SESSION_REFRESH_TOKEN_KEY = 'refreshToken';
const SESSION_WARNING_MS = 60 * 1000;
const FALLBACK_SESSION_MS = 60 * 60 * 1000;
const LAST_ROUTE_KEY = 'auth_redirect_path';

const SESSION_EXPIRED_MESSAGE = 'Session expired';
const REDIRECT_DELAY_MS = 900;

let isRedirectingToLogin = false;

function clearClientAuthState() {
  Cookies.remove('access_token', { path: '/' });
  Cookies.remove('token', { path: '/' });
  Cookies.remove('auth_token', { path: '/' });
  Cookies.remove('refreshToken', { path: '/' });
  Cookies.remove('refresh_token', { path: '/' });

  localStorage.removeItem('currentUser');
  localStorage.removeItem(SESSION_ACCESS_TOKEN_KEY);
  localStorage.removeItem(SESSION_REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_EXPIRY_AT_KEY);
}

function getCurrentRelativePath() {
  if (typeof window === 'undefined') {
    return null;
  }

  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

function isSafeRedirectPath(path?: string | null) {
  return !!path && path.startsWith('/') && !path.startsWith('//');
}

export function storePostLoginRedirect(path?: string | null) {
  if (typeof window === 'undefined') {
    return null;
  }

  const redirectPath = path ?? getCurrentRelativePath() ?? '/';

  if (!isSafeRedirectPath(redirectPath) || redirectPath.startsWith('/login')) {
    localStorage.removeItem(LAST_ROUTE_KEY);
    return null;
  }

  localStorage.setItem(LAST_ROUTE_KEY, redirectPath);
  return redirectPath;
}

export function consumePostLoginRedirect() {
  if (typeof window === 'undefined') {
    return null;
  }

  const redirectPath = localStorage.getItem(LAST_ROUTE_KEY);
  localStorage.removeItem(LAST_ROUTE_KEY);

  return isSafeRedirectPath(redirectPath) ? redirectPath : null;
}

function decodeJwtPayload(token: string) {
  const parts = token.split('.');

  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = typeof window !== 'undefined' ? window.atob(padded) : Buffer.from(padded, 'base64').toString('utf-8');

    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

export function storeSessionAccessToken(token?: string | null, refreshToken?: string | null) {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!token) {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('access_token', { path: '/' });
    Cookies.remove('auth_token', { path: '/' });
    localStorage.removeItem(SESSION_ACCESS_TOKEN_KEY);
    localStorage.removeItem(SESSION_EXPIRY_AT_KEY);
    return null;
  }

  const payload = decodeJwtPayload(token);
  const tokenExpiryAt = payload?.exp ? payload.exp * 1000 : null;
  const expiryAt =
    tokenExpiryAt && tokenExpiryAt > Date.now()
      ? tokenExpiryAt
      : Date.now() + FALLBACK_SESSION_MS;

  const accessCookieOptions = {
    path: '/',
    sameSite: 'lax' as const,
    expires: new Date(expiryAt),
  };

  Cookies.set('token', token, accessCookieOptions);
  Cookies.set('access_token', token, accessCookieOptions);
  Cookies.set('auth_token', token, accessCookieOptions);

  if (refreshToken) {
    const refreshPayload = decodeJwtPayload(refreshToken);
    const refreshExpiryAt = refreshPayload?.exp ? refreshPayload.exp * 1000 : expiryAt;

    Cookies.set('refreshToken', refreshToken, {
      path: '/',
      sameSite: 'lax',
      expires: new Date(refreshExpiryAt),
    });
    localStorage.setItem(SESSION_REFRESH_TOKEN_KEY, refreshToken);
  }

  localStorage.setItem(SESSION_ACCESS_TOKEN_KEY, token);
  localStorage.setItem(SESSION_EXPIRY_AT_KEY, String(expiryAt));
  return expiryAt;
}

export function getStoredSessionExpiryAt() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = localStorage.getItem(SESSION_EXPIRY_AT_KEY);

  if (!rawValue) {
    return null;
  }

  const expiryAt = Number(rawValue);
  return Number.isFinite(expiryAt) ? expiryAt : null;
}

export function getSessionWarningMs() {
  return SESSION_WARNING_MS;
}

export function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  const redirectPath = storePostLoginRedirect();
  clearClientAuthState();
  const loginUrl = new URL('/login', window.location.origin);
  loginUrl.searchParams.set('reason', SESSION_EXPIRED_REASON);

  if (redirectPath) {
    loginUrl.searchParams.set('redirect', redirectPath);
  }

  window.location.replace(loginUrl.toString());
}

export function logoutToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  clearClientAuthState();
  window.location.replace('/login');
}

export function handleSessionExpired() {
  if (typeof window === 'undefined' || isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;
  const redirectPath = storePostLoginRedirect();
  clearClientAuthState();
  toast.error(SESSION_EXPIRED_MESSAGE, { id: SESSION_EXPIRED_REASON });

  window.setTimeout(() => {
    const loginUrl = new URL('/login', window.location.origin);
    loginUrl.searchParams.set('reason', SESSION_EXPIRED_REASON);

    if (redirectPath) {
      loginUrl.searchParams.set('redirect', redirectPath);
    }

    window.location.replace(loginUrl.toString());
  }, REDIRECT_DELAY_MS);
}

export function getSessionExpiredMessage() {
  return SESSION_EXPIRED_MESSAGE;
}
