'use client';

import { X, Music } from 'lucide-react';
import type { VideoItem } from '@/app/data/admin';

// Player modal: <video> for video, <audio> for audio. `item` = null closes it.
export default function MediaPreview({ item, onClose }: { item: VideoItem | null; onClose: () => void }) {
  if (!item || !item.url) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex justify-end">
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {item.mediaType === 'audio' ? (
          <div className="rounded-2xl bg-neutral-900 p-8">
            <div className="mb-5 flex items-center justify-center">
              <Music className="h-16 w-16 text-neutral-600" />
            </div>
            <audio src={item.url} controls autoPlay className="w-full" />
          </div>
        ) : (
          <video
            src={item.url}
            poster={item.poster || undefined}
            controls
            autoPlay
            className="max-h-[80vh] w-full rounded-2xl bg-black"
          />
        )}
        {item.description && (
          <p className="mt-3 text-center text-sm text-neutral-300">{item.description}</p>
        )}
      </div>
    </div>
  );
}