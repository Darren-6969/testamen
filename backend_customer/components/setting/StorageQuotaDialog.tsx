// components/setting/StorageQuotaDialog.tsx
// Shown when an upload is blocked or partially blocked by the storage quota.
//
// The CTA routes to /module/setting/plan. That page's ENABLE_UPGRADE flag is
// currently false, so the upgrade buttons render disabled — this dialog is built
// as though the payment flow exists, and goes live the moment that flag flips.
'use client';

import { useRouter } from 'next/navigation';
import { TriangleAlert, HardDrive, X } from 'lucide-react';

export interface SkippedFile {
  name: string;
  sizeMb: number;
}

export interface QuotaInfo {
  plan?: string;
  usedMb?: number;
  totalMb?: number;
  remainingMb?: number;
}

interface StorageQuotaDialogProps {
  open: boolean;
  onClose: () => void;
  /** Server message; falls back to a generic line. */
  message?: string;
  quota: QuotaInfo;
  /** Files dropped for lack of space. Empty when nothing was uploaded at all. */
  skipped?: SkippedFile[];
  /** True when some files did land — changes the tone from failure to partial. */
  partial?: boolean;
}

export default function StorageQuotaDialog({
  open,
  onClose,
  message,
  quota,
  skipped = [],
  partial = false,
}: StorageQuotaDialogProps) {
  const router = useRouter();
  if (!open) return null;

  const used = quota.usedMb ?? 0;
  const total = quota.totalMb ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-50">
              <TriangleAlert size={18} className="text-[#c3195d]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                {partial ? 'Some files were not uploaded' : 'Not enough storage'}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {message ||
                  'You have run out of storage space. Upgrade your plan or remove some files.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Usage bar */}
        <div className="mt-5 rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <HardDrive size={14} className="text-[#c3195d]" />
              {quota.plan || 'Free'} plan
            </span>
            <span className="font-medium text-neutral-900">
              {used} / {total} MB
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-[#c3195d]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {skipped.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Skipped {skipped.length} file{skipped.length > 1 ? 's' : ''}
            </p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
              {skipped.map((f) => (
                <li
                  key={f.name}
                  className="flex justify-between gap-3 text-sm text-neutral-600"
                >
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-neutral-400">{f.sizeMb} MB</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => router.push('/module/setting/plan')}
            className="rounded-lg bg-[#c3195d] px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Upgrade plan
          </button>
        </div>
      </div>
    </div>
  );
}