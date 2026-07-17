// components/setting/CopyShareField.tsx
// Read-only value with copy + share actions. Replaces the legacy
// copyReferral()/shareReferral() inline scripts.
//
// The legacy used document.execCommand('copy'), which is deprecated. This uses
// the async Clipboard API and falls back to execCommand only when it is
// unavailable (non-secure origins still need it).
'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import Input from '@/components/input/Input';

interface CopyShareFieldProps {
  id: string;
  value: string;
  /** Text used for the native/WhatsApp share sheet. Omit to hide the share button. */
  shareText?: string;
  shareTitle?: string;
  placeholder?: string;
}

export default function CopyShareField({
  id,
  value,
  shareText,
  shareTitle = 'Share',
  placeholder = '—',
}: CopyShareFieldProps) {
  const [copied, setCopied] = useState(false);
  const hasValue = !!value?.trim();

  const handleCopy = async () => {
    if (!hasValue) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (!el) return;
        el.select();
        el.setSelectionRange(0, 99999);
        document.execCommand('copy');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShare = async () => {
    if (!hasValue || !shareText) return;

    // Native share sheet on mobile; WhatsApp fallback elsewhere.
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText });
        return;
      } catch (err) {
        // User dismissed the sheet — not an error worth surfacing.
        return;
      }
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input id={id} value={value || ''} placeholder={placeholder} readOnly />
        </div>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!hasValue}
          title="Copy"
          aria-label="Copy"
          className="h-10 w-10 shrink-0 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[#c3195d] hover:bg-pink-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
        </button>

        {shareText && (
          <button
            type="button"
            onClick={handleShare}
            disabled={!hasValue}
            title="Share"
            aria-label="Share"
            className="h-10 w-10 shrink-0 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[#c3195d] hover:bg-pink-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Share2 size={16} />
          </button>
        )}
      </div>

      {copied && <p className="mt-1 text-sm text-green-600">Copied!</p>}
    </div>
  );
}