'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Play, Trash2, Video as VideoIcon, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import { fetchVideos, uploadVideos, deleteMedia, VideoItem } from '@/app/data/admin';
import { formatBytes } from '@/app/lib/format';
import MediaPreview from '@/components/admin/MediaPreview';
import UploadDialog from '@/components/admin/UploadDialog';
import ConfirmDialog, { ConfirmData } from '@/components/admin/ConfirmDialog';

export default function VideosTab() {
  const { activeMemorial } = useActiveMemorial();
  const memorialId = activeMemorial?.numberList || '';
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<VideoItem | null>(null);
  const [pending, setPending] = useState<File[] | null>(null);
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);
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

  // Picking files only stages them -- nothing uploads until Save in the dialog.
  const onFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    setPending(Array.from(files));
  };

  const doUpload = async (descriptions: string[]) => {
    if (!pending) return;
    setBusy(true);
    const res = await uploadVideos(memorialId, pending, { descriptions });
    setBusy(false);
    if (res.status === 'success') {
      setPending(null);
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

  const askDelete = (v: VideoItem) =>
    setConfirm({
      title: v.mediaType === 'audio' ? 'Delete this audio?' : 'Delete this video?',
      message: 'It will be removed from the memorial.',
      confirmLabel: 'Delete',
      tone: 'danger',
      onConfirm: () => remove(v.id),
    });

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
        onChange={(e) => {
          onFiles(e.target.files);
          // reset so picking the same file again still fires onChange
          e.target.value = '';
        }}
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
            <div key={v.id} className="w-32">
              <div className="group relative h-32 w-32 flex-none overflow-hidden rounded-xl bg-neutral-900">
                <button
                  onClick={() => setPreview(v)}
                  className="block h-full w-full cursor-pointer"
                  aria-label="Play"
                >
                  {v.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.poster}
                      alt=""
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-500">
                      {v.mediaType === 'audio' ? (
                        <Music className="h-8 w-8" />
                      ) : (
                        <VideoIcon className="h-8 w-8" />
                      )}
                    </div>
                  )}
                </button>

                {/* hover overlay */}
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                  <Play className="h-6 w-6 text-white" />
                </span>

                {/* size on hover */}
                {v.sizeBytes ? (
                  <span className="pointer-events-none absolute bottom-1.5 left-1.5 hidden rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white group-hover:block">
                    {formatBytes(v.sizeBytes)}
                  </span>
                ) : null}

                {/* delete on hover */}
                <div className="absolute right-1.5 top-1.5 hidden group-hover:block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      askDelete(v);
                    }}
                    aria-label="Delete"
                    className="rounded-md bg-white/85 p-1 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {v.description && (
                <p className="mt-1.5 line-clamp-2 text-xs text-neutral-500">{v.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---------- Upload + description ---------- */}
      {pending && (
        <UploadDialog
          files={pending}
          kind="video"
          busy={busy}
          onCancel={() => setPending(null)}
          onSave={doUpload}
        />
      )}

      {/* ---------- Player ---------- */}
      <MediaPreview item={preview} onClose={() => setPreview(null)} />

      {/* ---------- Confirm delete ---------- */}
      <ConfirmDialog data={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}