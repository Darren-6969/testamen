'use client';

import { useEffect, useState } from 'react';
import { Music, X } from 'lucide-react';
import { formatBytes } from '@/app/lib/format';

// Shown after files are picked but BEFORE anything uploads: preview each file and optionally caption it. 
// Save hands the descriptions back index-matched to `files`; Cancel discards without uploading.
// Render conditionally (`{pending && <UploadDialog files={pending} .../>}`) so `files` is always a real array here.

function FilePreview({ file, url, kind }: { file: File; url?: string; kind: 'photo' | 'video' }) {
  // previews are created in an effect, so the first paint has no URL yet
  if (!url) return <div className="h-64 w-full animate-pulse rounded-lg bg-neutral-200" />;

  if (kind === 'photo') {
    return <img src={url} alt="" className="h-64 w-full rounded-lg bg-neutral-100 object-contain" />;
  }
  if (file.type.startsWith('audio/')) {
    return (
      <div className="rounded-lg bg-neutral-900 p-4">
        <div className="mb-3 flex justify-center">
          <Music className="h-10 w-10 text-neutral-600" />
        </div>
        <audio src={url} controls className="w-full" />
      </div>
    );
  }
  return <video src={url} controls className="h-64 w-full rounded-lg bg-black" />;
}

export default function UploadDialog({
  files,
  kind,
  busy,
  onCancel,
  onSave,
}: {
  files: File[];
  kind: 'photo' | 'video';
  busy?: boolean;
  onCancel: () => void;
  onSave: (descriptions: string[]) => void;
}) {
  const [descriptions, setDescriptions] = useState<string[]>(() => files.map(() => ''));
  const [previews, setPreviews] = useState<string[]>([]);

  // Blob URLs for local previews. Create AND revoke in the SAME effect so each mount owns its own URLs. 
  // Creating them in useMemo instead breaks under React StrictMode (on by default in Next dev), which mounts -> cleans up -> remounts:
  // the cleanup revokes the memoised URLs, useMemo doesn't recompute, and the
  // remounted <img>/<video> point at dead blobs (net::ERR_FILE_NOT_FOUND).
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const setAt = (i: number, v: string) =>
    setDescriptions((list) => list.map((d, j) => (j === i ? v : d)));

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-neutral-800">
            {files.length === 1 ? 'Add a description' : `Add descriptions (${files.length} files)`}
          </h3>
          <button
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="rounded-xl bg-neutral-50 p-3">
              <FilePreview file={f} url={previews[i]} kind={kind} />
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <p className="truncate text-xs font-medium text-neutral-600" title={f.name}>
                  {f.name}
                </p>
                <span className="flex-none text-[11px] text-neutral-400">
                  {formatBytes(f.size)}
                </span>
              </div>
              <textarea
                value={descriptions[i]}
                onChange={(e) => setAt(i, e.target.value)}
                placeholder="Add description (optional)"
                maxLength={1000}
                rows={2}
                className="mt-2 w-full resize-y rounded-lg border border-gray-200 p-2 text-sm text-neutral-700 focus:border-[#c3195d] focus:outline-none focus:ring-2 focus:ring-[#c3195d]/30"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(descriptions)}
            disabled={busy}
            className="rounded-lg bg-[#c3195d] px-4 py-2 text-sm font-medium text-white hover:bg-[#a81450] disabled:opacity-50"
          >
            {busy ? 'Uploading...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}