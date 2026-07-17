// components/setting/AvatarUpload.tsx
// Circular avatar with upload / remove actions.
//
// Uploads immediately on file select rather than deferring to the form's Save —
// the server replaces the file and updates the row in one request, so there is
// nothing for Save to submit. Keeping it separate also means a failed image
// never blocks a name/phone change.
'use client';

import { useRef, useState } from 'react';
import { User, Upload, Trash2 } from 'lucide-react';

interface AvatarUploadProps {
  /** Current image src, or null to show the fallback glyph. */
  pictureUrl: string | null;
  /** Used for the alt text. */
  name: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  maxBytes: number;
  acceptedTypes: string[];
  /** Reported back so the page can surface a toast. */
  onValidationError: (message: string) => void;
  disabled?: boolean;
}

export default function AvatarUpload({
  pictureUrl,
  name,
  onUpload,
  onRemove,
  maxBytes,
  acceptedTypes,
  onValidationError,
  disabled = false,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  // Shows the chosen image immediately, before the round trip finishes.
  const [preview, setPreview] = useState<string | null>(null);

  const shown = preview ?? pictureUrl;
  const maxMb = Math.round(maxBytes / (1024 * 1024));

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so re-picking the same file still fires onChange.
    event.target.value = '';
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      onValidationError('Please choose a JPG, PNG or WEBP image.');
      return;
    }
    if (file.size > maxBytes) {
      onValidationError(`Image must be ${maxMb}MB or smaller.`);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setBusy(true);

    try {
      await onUpload(file);
    } finally {
      setBusy(false);
      // The parent has the server URL by now; drop the local blob either way.
      setPreview(null);
      URL.revokeObjectURL(localUrl);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await onRemove();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div
        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[var(--border-color)] bg-gray-100 ${
          busy ? 'opacity-60' : ''
        }`}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={name || 'Profile picture'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#c3195d] px-3 py-1.5 text-sm font-medium text-[#c3195d] transition-colors hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={14} />
            {shown ? 'Change photo' : 'Upload photo'}
          </button>

          {pictureUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-sm font-medium text-[var(--form-text-caption)] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
        </div>

        <p className="mt-2 text-xs text-[var(--form-text-caption)]">
          JPG, PNG or WEBP. Max {maxMb}MB. Doesn&apos;t count towards your storage.
        </p>
      </div>
    </div>
  );
}