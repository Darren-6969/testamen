// app/components/layout/ClientLayout.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import MainLayout from './MainLayout';
import SessionExpiryWarning from './SessionExpiryWarning';
import { Toaster } from 'sonner';
import { handleSessionExpired } from '@/app/lib/session-expiration';
import { ActiveMemorialProvider } from '@/app/context/ActiveMemorialContext';

const AUTH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh-token',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

function isPublicAuthPath(pathname?: string | null) {
  if (!pathname) {
    return false;
  }

  return [
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/check-email',
    '/reset-success',
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function shouldHandleUnauthorized(url?: string, pathname?: string | null) {
  if (isPublicAuthPath(pathname)) {
    return false;
  }

  if (!url) {
    return true;
  }

  return !AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function handleAxiosUnauthorized(error: unknown) {
  const axiosError = error as {
    response?: { status?: number };
    config?: { url?: string };
  };

  if (
    axiosError?.response?.status === 401 &&
    shouldHandleUnauthorized(axiosError?.config?.url, typeof window === 'undefined' ? null : window.location.pathname)
  ) {
    handleSessionExpired();
  }

  return Promise.reject(error);
}

let axiosUnauthorizedHandlingInstalled = false;

function installAxiosUnauthorizedHandling() {
  if (axiosUnauthorizedHandlingInstalled) {
    return;
  }

  axios.interceptors.response.use((response) => response, handleAxiosUnauthorized);

  const originalCreate = axios.create.bind(axios);
  axios.create = (...args) => {
    const instance = originalCreate(...args);
    instance.interceptors.response.use((response) => response, handleAxiosUnauthorized);
    return instance;
  };

  axiosUnauthorizedHandlingInstalled = true;
}

installAxiosUnauthorizedHandling();

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const useMainLayout = pathname?.startsWith('/module');

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const resource = args[0];
      const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : undefined;

      if (response.status === 401 && shouldHandleUnauthorized(url, pathname)) {
        handleSessionExpired();
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [pathname]);

  return (
    <ActiveMemorialProvider>
      {useMainLayout ? <MainLayout>{children}</MainLayout> : children}
      <SessionExpiryWarning enabled={!!useMainLayout} />
      <Toaster position="top-right" richColors />
    </ActiveMemorialProvider>
  );
}
