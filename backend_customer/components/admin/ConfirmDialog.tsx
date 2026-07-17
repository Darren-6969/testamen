'use client';

import { TriangleAlert } from 'lucide-react';

export type ConfirmData = {
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'danger' | 'neutral';
  onConfirm: () => void;
};

// Confirmation modal for destructive / remove actions. Controlled via a `data` object (null = closed); `onClose` clears it. 
export default function ConfirmDialog({
  data,
  onClose,
}: {
  data: ConfirmData | null;
  onClose: () => void;
}) {
  if (!data) return null;
  const danger = data.tone === 'danger';
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex-none rounded-full p-2 ${
              danger ? 'bg-red-50 text-red-600' : 'bg-pink-50 text-[#c3195d]'
            }`}
          >
            <TriangleAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">{data.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">{data.message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              data.onConfirm();
              onClose();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#c3195d] hover:bg-[#a81450]'
            }`}
          >
            {data.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}