'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Play, Trash2, Video as VideoIcon, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import { fetchVideos, uploadVideos, deleteMedia, VideoItem } from '@/app/data/admin';

export default function VideosTab() {
  const { activeMemorial } = useActiveMemorial();
  const memorialId = activeMemorial?.numberList || '';
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!memorialId) return;
    setLoading(true);
    setVideos(await fetchVideos(memorialId));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memorialId]);

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    const res = await uploadVideos(memorialId, files);
    setBusy(false);
    if (res.status === 'success') {
      toast.success('Uploaded');
      load();
    } else toast.error(res.message || 'Upload failed');
  };

  const remove = async (id: string) => {
    const res = await deleteMedia('video', id);
    if (res.status === 'success') {
      toast.success('Removed');
      load();
    } else toast.error('Failed to remove');
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2 text-base font-medium text-gray-700">
        <VideoIcon className="h-5 w-5 text-[#c3195d]" />
        Videos &amp; Audios
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="video/*,audio/*"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files).then(() => (e.target.value = ''))}
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-neutral-400">Loading...</div>
      ) : (
        <div className="flex flex-wrap gap-4">
          <button
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className="flex h-32 w-32 flex-none flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-pink-200 text-xs text-[#b3567e] hover:bg-pink-50 disabled:opacity-50"
          >
            <Upload className="h-5 w-5" />
            Upload
          </button>

          {videos.map((v) => (
            <div key={v.id} className="group relative w-32">
              <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl bg-neutral-900 text-neutral-500">
                {v.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.poster} alt="" className="h-full w-full object-cover" />
                ) : v.mediaType === 'audio' ? (
                  <Music className="h-8 w-8" />
                ) : (
                  <VideoIcon className="h-8 w-8" />
                )}
                <a
                  href={v.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#c3195d]"
                >
                  <Play className="h-4 w-4" />
                </a>
                <button
                  onClick={() => remove(v.id)}
                  aria-label="Delete"
                  className="absolute right-1.5 top-1.5 hidden rounded-md bg-white/85 p-1 text-red-500 group-hover:block"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {v.description && <p className="mt-1.5 line-clamp-2 text-xs text-neutral-500">{v.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}