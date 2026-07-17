// app/context/StorageContext.tsx
// Shares account storage between the admin layout (which renders the bar) and
// the child pages (which upload and therefore change it).
//
// Without this the bar fetches once on mount and then lies: upload 40MB and it
// keeps showing the old number until you switch memorials or reload. Harmless
// before quota enforcement; actively misleading after it, since the bar would
// claim free space while the server rejects the upload.
//
// Same shape as ActiveMemorialContext.
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { fetchStorage, StorageInfo } from '@/app/data/admin';

interface StorageContextValue {
  storage: StorageInfo | null;
  /** Re-read from the server. Call after any upload or delete. */
  refresh: () => Promise<void>;
  /** Server-reported free space. null while loading. */
  remainingMb: number | null;
  /** True once the account has no space left at all. */
  isFull: boolean;
}

const StorageContext = createContext<StorageContextValue>({
  storage: null,
  refresh: async () => {},
  remainingMb: null,
  isFull: false,
});

export function StorageProvider({ children }: { children: ReactNode }) {
  const [storage, setStorage] = useState<StorageInfo | null>(null);

  const refresh = useCallback(async () => {
    const s = await fetchStorage();
    setStorage(s);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<StorageContextValue>(() => {
    // Prefer the server's remainingMb over recomputing total - used, so the
    // client can never disagree with the number enforcement actually uses.
    const remainingMb =
      storage == null
        ? null
        : typeof storage.remainingMb === 'number'
          ? storage.remainingMb
          : Math.max(0, storage.totalMb - storage.usedMb);

    return {
      storage,
      refresh,
      remainingMb,
      // Unknown storage must not disable uploads — fail open, let the server decide.
      isFull: remainingMb !== null && remainingMb <= 0,
    };
  }, [storage, refresh]);

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export const useStorage = () => useContext(StorageContext);