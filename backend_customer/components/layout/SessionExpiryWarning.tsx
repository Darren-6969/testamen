'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import {
  getSessionWarningMs,
  getStoredSessionExpiryAt,
  handleSessionExpired,
  redirectToLogin,
  logoutToLogin,
  storeSessionAccessToken,
} from '@/app/lib/session-expiration';

const WARNING_MESSAGE = 'Your session is about to expire. Do you want to continue?';
const REFRESH_ENDPOINT = '/api/auth/refresh-token';
const LOGOUT_ENDPOINT = '/api/auth/logout';
const NOOP = () => {};
const ACTIVE_USER_WINDOW_MS = 20 * 1000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['mousedown', 'keydown', 'scroll', 'touchstart'];

function formatCountdown(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function SessionExpiryWarning({ enabled }: { enabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expiryAt, setExpiryAt] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const lastActivityAtRef = useRef(Date.now());
  const isRefreshingRef = useRef(false);
  const silentRefreshAttemptedForRef = useRef<number | null>(null);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    if (!enabled) {
      setIsOpen(false);
      setExpiryAt(null);
      setTimeLeftMs(0);
      lastActivityAtRef.current = Date.now();
      silentRefreshAttemptedForRef.current = null;
      return;
    }

    setExpiryAt(getStoredSessionExpiryAt());
  }, [enabled]);

  useEffect(() => {
    silentRefreshAttemptedForRef.current = null;
  }, [expiryAt]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const markActivity = () => {
      lastActivityAtRef.current = Date.now();
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });
    window.addEventListener('focus', markActivity);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      window.removeEventListener('focus', markActivity);
    };
  }, [enabled]);

  const continueSession = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (isRefreshingRef.current) {
      return false;
    }

    setIsRefreshing(true);
    isRefreshingRef.current = true;

    try {
      const response = await fetch(REFRESH_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      const nextExpiryAt = storeSessionAccessToken(data.accessToken);

      if (!nextExpiryAt) {
        throw new Error('Missing access token');
      }

      setExpiryAt(nextExpiryAt);
      setIsOpen(false);

      if (!silent) {
        toast.success('Session continued');
      }

      return true;
    } catch {
      setIsOpen(false);
      handleSessionExpired();
      return false;
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  };

  useEffect(() => {
    if (!enabled || !expiryAt) {
      return;
    }

    const warningMs = getSessionWarningMs();

    const syncState = () => {
      const remainingMs = expiryAt - Date.now();
      setTimeLeftMs(remainingMs);

      if (remainingMs <= 0) {
        setIsOpen(false);
        redirectToLogin();
        return;
      }

      if (remainingMs > warningMs) {
        setIsOpen(false);
        return;
      }

      const isRecentlyActive = Date.now() - lastActivityAtRef.current <= ACTIVE_USER_WINDOW_MS;

      if (
        isRecentlyActive &&
        !isRefreshingRef.current &&
        silentRefreshAttemptedForRef.current !== expiryAt
      ) {
        silentRefreshAttemptedForRef.current = expiryAt;
        void continueSession({ silent: true });
        return;
      }

      setIsOpen(true);
    };

    syncState();

    const intervalId = window.setInterval(syncState, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, expiryAt]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const syncFromStorage = () => {
      setExpiryAt(getStoredSessionExpiryAt());
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('focus', syncFromStorage);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, [enabled]);

  const countdownLabel = useMemo(() => formatCountdown(timeLeftMs), [timeLeftMs]);

  const handleContinueSession = async () => {
    await continueSession();
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch(LOGOUT_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // Ignore network issues here and let the shared expiration flow clear local state.
    } finally {
      setIsOpen(false);
      logoutToLogin();
      setIsLoggingOut(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={NOOP}
      title="Session expiring soon"
      size="sm"
      showCloseButton={false}
      backdropClassName="bg-slate-900/20 backdrop-blur-[2px]"
      panelClassName="border border-white/70 shadow-2xl"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700">{WARNING_MESSAGE}</p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Time remaining</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{countdownLabel}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isRefreshing || isLoggingOut}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
          <button
            type="button"
            onClick={handleContinueSession}
            disabled={isRefreshing || isLoggingOut}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? 'Continuing...' : 'Continue session'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
